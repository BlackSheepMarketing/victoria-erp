# Productos Victoria ERP — Backend (NestJS + MySQL + TypeORM)

Reconstrucción del backend del **Productos Victoria ERP** (Black Sheep Dev),
independizándolo de Supabase. Este paquete cubre la **Fase 1 + primer vertical
slice** del Handoff: scaffold del proyecto, **Auth con JWT/RBAC** y el módulo
**Clientes** de punta a punta como plantilla, más la pieza fiscal base de **NCF
con bloqueo pesimista**. Incluye además la capa de integración del frontend
React (el `api` client y los hooks reescritos).

Todo lo aquí incluido está **verificado corriendo** contra un MySQL real:
login + `/auth/me` + guard 401, CRUD de clientes devolviendo el mismo shape de
JSON que Supabase (`vendedores` anidado) con filtros, y emisión concurrente de
30 NCF que resultó estrictamente secuencial (1..30, sin duplicados ni huecos).

---

## 1. Requisitos

- Node.js 20+ y npm
- MySQL 8 / MariaDB 10.6+

## 2. Puesta en marcha (local)

```bash
# 1. Dependencias
npm install

# 2. Configuración
cp .env.example .env
#   edita .env con tus credenciales de MySQL y tus secretos JWT

# 3. Crea la base (una vez)
#   CREATE DATABASE victoria_erp CHARACTER SET utf8mb4;

# 4a. Camino RÁPIDO para probar ya (dev): deja DB_SYNCHRONIZE=true en .env
#     y TypeORM crea las tablas al arrancar.
# 4b. Camino PRODUCCIÓN (recomendado): DB_SYNCHRONIZE=false y usa migraciones
npm run migration:generate -- src/database/migrations/InitVictoria
npm run migration:run

# 5. Seed de roles + usuario admin de prueba
npm run seed:roles
#   -> admin@productosvictoria.do / Victoria123*  (CÁMBIALO)

# 6. Arranca
npm run start:dev     # desarrollo con watch
npm run start:prod    # producción (requiere npm run build antes)
```

La API queda en `http://localhost:3000/api`.

> ⚠️ **Nunca uses `DB_SYNCHRONIZE=true` en producción.** Es data fiscal; en
> producción los cambios de esquema van por migraciones versionadas.

## 3. Endpoints incluidos

**Auth**
- `POST /api/auth/register` — `{ email, nombre, password, rolIds? }`
- `POST /api/auth/login` — `{ email, password }` → `{ access_token, refresh_token, user }`
- `POST /api/auth/refresh` — `{ refresh_token }`
- `GET  /api/auth/me` — perfil del usuario autenticado (Bearer token)

**Clientes** (todos requieren Bearer + permiso)
- `GET    /api/clientes` — filtros: `?search=&tipo=&estado=&vendedor_id=`
- `GET    /api/clientes/:id`
- `POST   /api/clientes`
- `PATCH  /api/clientes/:id`
- `DELETE /api/clientes/:id`

---

## 4. Las dos reglas de oro (por qué el front casi no se toca)

**#1 — Paridad de shape de JSON.** La API devuelve exactamente los mismos
objetos que devolvía Supabase, joins anidados incluidos. Ejemplo real de
`GET /clientes`:

```json
[
  {
    "id": "f40d7106-...",
    "razon_social": "Supermercado Nacional SRL",
    "tipo": "Institucional",
    "rnc": "101023456",
    "vendedor_id": "1781c2aa-...",
    "vendedores": { "nombre": "Juan Pérez" }
  }
]
```

Fíjate que la clave del embed es `vendedores` (nombre de la tabla en Supabase),
igual que `.select('*, vendedores(nombre)')`. El mapeo entidad→shape vive en
`clientes.service.ts` (`toShape`).

**#2 — Los hooks son la costura.** Solo se reescribe el *interior* de cada hook.
Ver `frontend-integration/`:
- `src/lib/api.js` — reemplaza `customSupabaseClient.js` (fetch + Bearer + refresh automático).
- `src/hooks/useAuth.jsx` — reemplaza `supabase.auth.*`.
- `src/hooks/useClientes.js` — `supabase.from('clientes')...` → `api.get/post/...`.

En el front: cambia `VITE_SUPABASE_*` por `VITE_API_URL=http://localhost:3000/api`.

---

## 5. NCF — lo innegociable

`src/modules/facturas/ncf.service.ts` emite el siguiente NCF dentro de una
transacción con **bloqueo pesimista de fila** (`setLock('pessimistic_write')`
→ `SELECT ... FOR UPDATE`). Probado con 30 emisiones en paralelo: resultado
`1..30` sin duplicados ni huecos. En Fase 4 este mismo bloque envuelve la
creación de la factura + sus detalles para que todo sea atómico.

---

## 6. El patrón a repetir (cómo se agregan los demás módulos)

Cada módulo del ERP (Cotizaciones, Pedidos, Productos, Entregas, BOM, etc.)
sigue el mismo vertical slice que Clientes:

```
src/modules/<modulo>/
  entities/<x>.entity.ts     # entidad TypeORM (mapeo Postgres→MySQL, §6 Handoff)
  dto/create-<x>.dto.ts      # validación class-validator
  dto/update-<x>.dto.ts
  dto/query-<x>.dto.ts       # filtros del listado
  <modulo>.service.ts        # queries + mapper a shape Supabase
  <modulo>.controller.ts     # endpoints + Guards/@Permisos
  <modulo>.module.ts         # registro
```

Luego se registra en `app.module.ts` y se reescribe el hook correspondiente en
el front (`use<Modulo>.js`). Nada más.

---

## 7. Cuando llegue el `schema.sql` real (ajuste)

Este slice usa los campos **visibles en las pantallas** de Clientes. Cuando
tengas el export del esquema de Supabase (`pg_dump --schema-only`), ajusta las
**entidades** para calzar 1:1 con las tablas reales (nombres de columna, tipos,
nullability). Puntos de ajuste marcados con comentarios en el código:
`usuario.entity.ts`, `cliente.entity.ts`, `permiso.entity.ts`. El resto
(service/controller/hook) casi no cambia porque el shape ya está fijado.

Recordatorios de limpieza del Handoff §5 al modelar en MySQL:
- Descartar tablas duplicadas en inglés (`clients`, `products`, `sales`,
  `sale_items`) — las canónicas son las españolas.
- Consolidar `rutas_entrega` vs `rutas_entrega_nueva` en una sola.

Mapeo de tipos Postgres→MySQL aplicado (Handoff §6): `uuid`→`char(36)`,
`timestamptz`→`datetime` en UTC, `numeric/decimal`→`DECIMAL` (nunca float para
dinero/ITBIS — ver `common/transformers/numeric.transformer.ts`), `text[]/jsonb`
→`JSON`, RLS → Guards en la API.

---

## 8. Despliegue (VPS + EasyPanel, resumen del Handoff §9)

- **MySQL**: servicio MySQL/MariaDB en EasyPanel.
- **NestJS**: servicio Node detrás de `api.tudominio.com` + SSL. `npm run build`
  y `node dist/main.js`. Variables: `DATABASE_URL`/`DB_*`, `JWT_*`, correo.
- **React**: `npm run build` → servir `dist/` estático con fallback SPA (todas
  las rutas → `index.html`). Variable `VITE_API_URL`.
- **Backups (innegociable, es data fiscal)**: cron `mysqldump` diario + copia
  fuera del VPS.

---

## 9. Estructura del proyecto

```
src/
  main.ts                      # bootstrap (CORS, validación global, prefijo /api)
  app.module.ts                # wiring de módulos + conexión TypeORM
  config/
    typeorm.config.ts          # opciones de conexión (runtime)
    data-source.ts             # DataSource para la CLI de migraciones
  common/
    decorators/                # @CurrentUser, @Roles, @Permisos
    guards/                    # JwtAuthGuard, RolesGuard (reemplazo de RLS)
    transformers/              # DECIMAL → number sin perder precisión
  database/
    migrations/                # migraciones generadas por TypeORM
    seed-roles.ts              # seed RBAC + admin de prueba
  modules/
    auth/                      # JWT + RBAC (usuarios/roles/permisos)
    clientes/                  # vertical slice plantilla
    vendedores/                # entidad para el join anidado
    facturas/                  # NcfService (bloqueo pesimista)
frontend-integration/
  src/lib/api.js               # reemplazo de customSupabaseClient.js
  src/hooks/useAuth.jsx        # reemplazo de supabase.auth.*
  src/hooks/useClientes.js     # hook de datos reescrito
```

## 10. Próximos pasos sugeridos

1. Traer el `schema.sql` y ajustar entidades (§7).
2. Repetir el patrón para **Productos** y **Vendedores** (endpoints + hooks).
3. Fase 4: **Facturas + NCF** completas, imports (`import-*`, `rollback-importacion`)
   y `send-invoice-email` (definir proveedor de correo: SMTP / Resend / SendGrid).
```

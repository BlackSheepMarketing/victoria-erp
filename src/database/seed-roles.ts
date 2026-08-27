import 'reflect-metadata';
import dataSource from '../config/data-source';
import { Rol } from '../modules/auth/entities/rol.entity';
import { Permiso } from '../modules/auth/entities/permiso.entity';
import { Usuario } from '../modules/auth/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Seed minimo de RBAC + un usuario admin, para poder probar el login apenas
 * levantas la base. Corre con:  npm run seed:roles
 *
 * Ajusta la lista de permisos a medida que agregues modulos.
 */
async function run() {
  await dataSource.initialize();
  const rolRepo = dataSource.getRepository(Rol);
  const permRepo = dataSource.getRepository(Permiso);
  const userRepo = dataSource.getRepository(Usuario);

  const codigos = [
    'clientes.read',
    'clientes.write',
    'cotizaciones.read',
    'cotizaciones.write',
    'pedidos.read',
    'pedidos.write',
    'productos.read',
    'productos.write',
    'facturas.read',
    'facturas.emitir',
  ];

  // Permisos
  const permisos: Permiso[] = [];
  for (const codigo of codigos) {
    let p = await permRepo.findOne({ where: { codigo } });
    if (!p) p = await permRepo.save(permRepo.create({ codigo }));
    permisos.push(p);
  }

  // Rol admin con todos los permisos
  let admin = await rolRepo.findOne({
    where: { nombre: 'admin' },
    relations: { permisos: true },
  });
  if (!admin) admin = rolRepo.create({ nombre: 'admin', descripcion: 'Acceso total' });
  admin.permisos = permisos;
  admin = await rolRepo.save(admin);

  // Usuario admin de prueba
  const email = 'admin@productosvictoria.do';
  let usuario = await userRepo.findOne({ where: { email } });
  if (!usuario) {
    usuario = userRepo.create({
      email,
      nombre: 'Administrador',
      passwordHash: await bcrypt.hash('Victoria123*', 10),
      activo: true,
      roles: [admin],
    });
    await userRepo.save(usuario);
    console.log(`Usuario admin creado: ${email} / Victoria123*`);
  } else {
    console.log(`Usuario admin ya existe: ${email}`);
  }

  await dataSource.destroy();
  console.log('Seed de roles completado.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendedor } from '../../vendedores/entities/vendedor.entity';
import { ContactoCliente } from './contacto-cliente.entity';

/** Tipo de cliente segun las pantallas del front. */
export type TipoCliente =
  | 'Mayorista'
  | 'Institucional'
  | 'Detalle'
  | 'Distribuidor';

/**
 * Cliente (CRM). Campos tomados de las pantallas del front (Handoff — atajo
 * "Empieza por Clientes"): Razon Social, Tipo, RNC/RUC, Contacto, Email,
 * Telefono, Direccion, Estado, Notas, Vendedor asignado.
 *
 * Ajuste con schema real: renombra/agrega columnas para calzar exactamente
 * con la tabla `clientes` de Supabase cuando llegue el schema.sql.
 */
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 255 })
  razon_social: string;

  @Column({ type: 'varchar', length: 50, default: 'Detalle' })
  tipo: TipoCliente;

  /** RNC (empresas) o cedula. En DR el RNC es clave para facturacion fiscal. */
  @Column({ name: 'rnc', type: 'varchar', length: 20, nullable: true })
  rnc: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contacto: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  /** Estado del cliente: 'activo' | 'inactivo'. */
  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  // ── Relacion con Vendedor ────────────────────────────
  // Se guarda la FK `vendedor_id` y se expone el objeto `vendedores` anidado
  // para conservar el shape de Supabase `.select('*, vendedores(nombre)')`.
  @Column({ name: 'vendedor_id', type: 'char', length: 36, nullable: true })
  vendedor_id: string | null;

  @ManyToOne(() => Vendedor, (vendedor) => vendedor.clientes, {
    nullable: true,
  })
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor | null;

  @OneToMany(() => ContactoCliente, (contacto) => contacto.cliente, {
    cascade: true,
  })
  contactos: ContactoCliente[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updated_at: Date;
}

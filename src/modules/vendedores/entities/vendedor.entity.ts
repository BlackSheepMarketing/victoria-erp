import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';

/**
 * Vendedor (fuerza de ventas). Se referencia desde Cliente para poder
 * reproducir el join anidado `.select('*, vendedores(nombre)')` de Supabase.
 */
@Entity('vendedores')
export class Vendedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  activo: boolean;

  @OneToMany(() => Cliente, (cliente) => cliente.vendedor)
  clientes: Cliente[];
}

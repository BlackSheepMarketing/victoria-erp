import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';

/**
 * Contactos adicionales de un cliente (tabla `contactos_cliente` del
 * inventario del Handoff §5). Relacion 1:N con Cliente.
 */
@Entity('contactos_cliente')
export class ContactoCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'char', length: 36 })
  cliente_id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @ManyToOne(() => Cliente, (cliente) => cliente.contactos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;
}

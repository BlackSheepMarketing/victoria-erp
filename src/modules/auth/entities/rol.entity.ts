import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Permiso } from './permiso.entity';

/**
 * Rol dentro del RBAC. La relacion rol<->permiso se modela sobre la tabla
 * puente `rol_permisos` que ya existia en Supabase.
 */
@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @ManyToMany(() => Usuario, (usuario) => usuario.roles)
  usuarios: Usuario[];

  @ManyToMany(() => Permiso, (permiso) => permiso.roles, { cascade: false })
  @JoinTable({
    name: 'rol_permisos',
    joinColumn: { name: 'rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisos: Permiso[];
}

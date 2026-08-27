import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity';

/**
 * Tabla `usuarios` — pasa a ser la tabla de autenticacion (Handoff §4).
 * Los hashes bcrypt ya migrados desde Supabase siguen funcionando.
 *
 * IMPORTANTE: esta entidad es un punto de ajuste cuando llegue el schema.sql
 * real. Los campos aqui son los minimos para auth + el shape que consume el
 * front; agrega/renombra columnas para calzar con la tabla real.
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  /**
   * Hash bcrypt. `select: false` -> nunca se incluye en los selects por
   * defecto, asi el password_hash no se filtra en las respuestas JSON.
   * Se pide explicitamente en el login con addSelect.
   */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  activo: boolean;

  @ManyToMany(() => Rol, (rol) => rol.usuarios, { cascade: false })
  @JoinTable({
    name: 'usuario_roles',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: Rol[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Rol } from './rol.entity';

/**
 * Permiso atomico (ej: `clientes.read`, `clientes.write`, `facturas.emitir`).
 * Los Guards comparan contra estos codigos.
 *
 * Ajuste con schema real: en Supabase `rol_permisos` podria guardar el permiso
 * como texto plano en vez de una tabla `permisos` normalizada. Si es asi,
 * simplifica: elimina esta entidad y lee el string directo de rol_permisos.
 */
@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @ManyToMany(() => Rol, (rol) => rol.permisos)
  roles: Rol[];
}

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/** Exige que el usuario tenga AL MENOS uno de estos roles. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISOS_KEY = 'permisos';
/** Exige que el usuario tenga AL MENOS uno de estos permisos. */
export const Permisos = (...permisos: string[]) =>
  SetMetadata(PERMISOS_KEY, permisos);

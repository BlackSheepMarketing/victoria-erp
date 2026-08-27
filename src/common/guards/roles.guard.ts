import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISOS_KEY,
  ROLES_KEY,
} from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Autorizacion basada en roles/permisos (reemplaza lo que hacia RLS en
 * Postgres — MySQL no tiene RLS, Handoff §4/§6). Lee los metadatos puestos
 * por @Roles() / @Permisos() y los compara contra req.user.
 *
 * Debe correr DESPUES de JwtAuthGuard para que req.user exista.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin requisitos declarados -> solo hace falta estar autenticado.
    if (!rolesRequeridos?.length && !permisosRequeridos?.length) return true;

    const user = context.switchToHttp().getRequest().user as AuthUser;
    if (!user) throw new ForbiddenException('No autenticado');

    if (rolesRequeridos?.length) {
      const ok = rolesRequeridos.some((r) => user.roles?.includes(r));
      if (ok) return true;
    }
    if (permisosRequeridos?.length) {
      const ok = permisosRequeridos.some((p) => user.permisos?.includes(p));
      if (ok) return true;
    }

    throw new ForbiddenException('No tienes permiso para esta accion');
  }
}

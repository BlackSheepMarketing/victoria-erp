import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permisos: string[];
}

/**
 * Inyecta el usuario autenticado en un controller:
 *   @Get('me') me(@CurrentUser() user: AuthUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);

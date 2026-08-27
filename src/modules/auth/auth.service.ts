import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Payload que viaja dentro del JWT. `roles` y `permisos` se incrustan para
 * que los Guards no tengan que golpear la base en cada request.
 */
export interface JwtPayload {
  sub: string; // usuario.id
  email: string;
  roles: string[]; // nombres de rol
  permisos: string[]; // codigos de permiso
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly roles: Repository<Rol>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Registro. En produccion normalmente lo hace un admin, no self-service. */
  async register(dto: RegisterDto) {
    const existe = await this.usuarios.findOne({ where: { email: dto.email } });
    if (existe) throw new ConflictException('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarios.create({
      email: dto.email,
      nombre: dto.nombre,
      passwordHash,
      activo: true,
    });

    if (dto.rolIds?.length) {
      usuario.roles = await this.roles.findByIds(dto.rolIds);
    }

    const guardado = await this.usuarios.save(usuario);
    return this.emitirTokens(guardado.id);
  }

  /** Login: valida credenciales y devuelve access + refresh + perfil. */
  async login(dto: LoginDto) {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.passwordHash') // columna es select:false por defecto
      .where('u.email = :email', { email: dto.email })
      .getOne();

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const ok = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales invalidas');

    return this.emitirTokens(usuario.id);
  }

  /** Refresh: valida el refresh token y re-emite el par de tokens. */
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.emitirTokens(payload.sub);
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }
  }

  /** Perfil del usuario autenticado (GET /auth/me). */
  async me(usuarioId: string) {
    const usuario = await this.cargarConRolesYPermisos(usuarioId);
    if (!usuario) throw new UnauthorizedException();
    return this.perfilPublico(usuario);
  }

  // ── internos ──────────────────────────────────────────

  private async emitirTokens(usuarioId: string) {
    const usuario = await this.cargarConRolesYPermisos(usuarioId);
    if (!usuario) throw new UnauthorizedException();

    const roles = (usuario.roles || []).map((r) => r.nombre);
    const permisos = Array.from(
      new Set(
        (usuario.roles || []).flatMap((r) =>
          (r.permisos || []).map((p) => p.codigo),
        ),
      ),
    );

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      roles,
      permisos,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      access_token,
      refresh_token,
      user: this.perfilPublico(usuario),
    };
  }

  private cargarConRolesYPermisos(usuarioId: string) {
    return this.usuarios.findOne({
      where: { id: usuarioId },
      relations: { roles: { permisos: true } },
    });
  }

  private perfilPublico(usuario: Usuario) {
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      activo: usuario.activo,
      roles: (usuario.roles || []).map((r) => r.nombre),
      permisos: Array.from(
        new Set(
          (usuario.roles || []).flatMap((r) =>
            (r.permisos || []).map((p) => p.codigo),
          ),
        ),
      ),
    };
  }
}

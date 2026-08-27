import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../modules/auth/entities/usuario.entity';
import { Rol } from '../modules/auth/entities/rol.entity';
import { Permiso } from '../modules/auth/entities/permiso.entity';

/**
 * Auto-arranque para el PRIMER despliegue (novice friendly).
 * Si SEED_ON_BOOT=true y la tabla `usuarios` está vacía, crea los permisos,
 * el rol admin y un usuario administrador — sin necesidad de correr scripts a
 * mano. Se ejecuta con el código YA compilado (no requiere ts-node).
 *
 * Una vez creado el admin, pon SEED_ON_BOOT=false para que no vuelva a correr.
 * Es idempotente igual: si ya hay usuarios, no hace nada.
 */
@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Bootstrap');

  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(Permiso) private readonly permisos: Repository<Permiso>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('SEED_ON_BOOT') !== 'true') return;

    const total = await this.usuarios.count();
    if (total > 0) {
      this.logger.log('Ya existen usuarios; se omite el seed inicial.');
      return;
    }

    const codigos = [
      'clientes.read',
      'clientes.write',
      'cotizaciones.read',
      'cotizaciones.write',
      'pedidos.read',
      'pedidos.write',
      'productos.read',
      'productos.write',
      'facturas.read',
      'facturas.emitir',
    ];

    const permisos: Permiso[] = [];
    for (const codigo of codigos) {
      let p = await this.permisos.findOne({ where: { codigo } });
      if (!p) p = await this.permisos.save(this.permisos.create({ codigo }));
      permisos.push(p);
    }

    let admin = await this.roles.findOne({
      where: { nombre: 'admin' },
      relations: { permisos: true },
    });
    if (!admin)
      admin = this.roles.create({ nombre: 'admin', descripcion: 'Acceso total' });
    admin.permisos = permisos;
    admin = await this.roles.save(admin);

    const email =
      this.config.get<string>('ADMIN_EMAIL') || 'admin@productosvictoria.do';
    const password =
      this.config.get<string>('ADMIN_PASSWORD') || 'Victoria123*';

    const usuario = this.usuarios.create({
      email,
      nombre: 'Administrador',
      passwordHash: await bcrypt.hash(password, 10),
      activo: true,
      roles: [admin],
    });
    await this.usuarios.save(usuario);

    this.logger.log(`Seed inicial OK. Usuario admin creado: ${email}`);
    this.logger.warn(
      'Recuerda poner SEED_ON_BOOT=false y DB_SYNCHRONIZE=false tras este primer arranque.',
    );
  }
}

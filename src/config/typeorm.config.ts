import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Opciones de conexion TypeORM construidas desde variables de entorno.
 * Usadas por AppModule (runtime) y por data-source.ts (CLI de migraciones).
 *
 * Notas de mapeo Postgres -> MySQL (ver Handoff §6):
 *  - Dinero/ITBIS: SIEMPRE DECIMAL, nunca float. `bigNumberStrings: false`
 *    dejaria los DECIMAL como string; los devolvemos como number via
 *    ColumnNumericTransformer en cada entidad para conservar el shape JSON.
 *  - timestamptz -> DATETIME, todo en UTC. `timezone: 'Z'` fuerza UTC.
 */
export const buildTypeOrmOptions = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: parseInt(config.get<string>('DB_PORT', '3306'), 10),
  username: config.get<string>('DB_USER', 'root'),
  password: config.get<string>('DB_PASSWORD', ''),
  database: config.get<string>('DB_NAME', 'victoria_erp'),
  // Cargar entidades por glob para no tener que registrarlas a mano.
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  // En dev conviene false + migraciones; nunca true en produccion (data fiscal).
  synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
  logging: config.get<string>('DB_LOGGING', 'false') === 'true',
  timezone: 'Z', // guardar/leer en UTC
  charset: 'utf8mb4',
  extra: {
    // Devuelve DECIMAL como string desde el driver; cada entidad lo
    // transforma a number con ColumnNumericTransformer (precision intacta).
    decimalNumbers: false,
  },
});

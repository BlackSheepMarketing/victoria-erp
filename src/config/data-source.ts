import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

// Cargar .env para la CLI de TypeORM (fuera del contexto de Nest).
loadEnv();

/**
 * DataSource usado por la CLI de TypeORM para generar y correr migraciones:
 *   npm run migration:generate -- src/database/migrations/NombreMigracion
 *   npm run migration:run
 *
 * Mantiene los mismos parametros que el runtime (typeorm.config.ts).
 */
export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'victoria_erp',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  timezone: 'Z',
  charset: 'utf8mb4',
});

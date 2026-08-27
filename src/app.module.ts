import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { FacturasModule } from './modules/facturas/facturas.module';

@Module({
  imports: [
    // Variables de entorno disponibles en toda la app.
    ConfigModule.forRoot({ isGlobal: true }),
    // Conexion a MySQL construida desde ConfigService.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config),
    }),
    AuthModule,
    ClientesModule,
    FacturasModule,
    // ── A medida que crezca el ERP, cada modulo nuevo (Cotizaciones,
    //    Pedidos, Productos, Facturas/NCF, MES...) se registra aqui,
    //    siguiendo el patron del slice de Clientes.
  ],
})
export class AppModule {}

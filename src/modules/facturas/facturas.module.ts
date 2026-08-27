import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NcfService } from './ncf.service';
import { NcfSecuencia } from './entities/ncf-secuencia.entity';

/**
 * Modulo de facturacion fiscal (Fase 4). Por ahora expone solo el servicio de
 * NCF como pieza base. Cuando se construya la factura completa se agregan
 * aqui las entidades `facturas` / `factura_detalles` y su controller.
 */
@Module({
  imports: [TypeOrmModule.forFeature([NcfSecuencia])],
  providers: [NcfService],
  exports: [NcfService],
})
export class FacturasModule {}

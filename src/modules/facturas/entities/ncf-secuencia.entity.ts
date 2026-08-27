import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Secuencias de NCF (comprobantes fiscales DGII). Los NCF deben ser
 * ESTRICTAMENTE secuenciales, sin huecos ni duplicados. De ahi el bloqueo
 * pesimista al emitir (ver NcfService).
 *
 * `tipo` = tipo de comprobante (ej: B01 credito fiscal, B02 consumo, B04
 * nota de credito, etc.). `prefijo` + `secuencia` forman el NCF completo.
 */
@Entity('ncf_secuencias')
export class NcfSecuencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  tipo: string;

  @Column({ type: 'varchar', length: 10 })
  prefijo: string;

  /** Ultimo numero emitido. El proximo NCF es secuencia_actual + 1. */
  @Column({ name: 'secuencia_actual', type: 'bigint' })
  secuencia_actual: number;

  /** Limite autorizado por DGII para este rango. No se puede exceder. */
  @Column({ name: 'secuencia_hasta', type: 'bigint' })
  secuencia_hasta: number;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  activo: boolean;
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NcfSecuencia } from './entities/ncf-secuencia.entity';

/**
 * NCF — INNEGOCIABLE (Handoff §4).
 * Emision de NCF dentro de una transaccion con bloqueo pesimista de fila
 * (SELECT ... FOR UPDATE via setLock('pessimistic_write')). Esto garantiza
 * que dos facturas emitidas en paralelo NO reciban el mismo numero ni dejen
 * huecos: la segunda transaccion espera a que la primera confirme.
 *
 * En Fase 4 este mismo bloque envuelve la creacion de la factura y sus
 * detalles, de modo que "reservar NCF + crear factura" sea 100% atomico.
 */
@Injectable()
export class NcfService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Reserva el siguiente NCF para un tipo dado, de forma atomica.
   * Devuelve el NCF completo (prefijo + numero con padding).
   */
  async emitirSiguiente(tipo: string): Promise<{ ncf: string; secuencia: number }> {
    return this.dataSource.transaction(async (manager) => {
      const sec = await manager
        .getRepository(NcfSecuencia)
        .createQueryBuilder('s')
        .setLock('pessimistic_write') // -> SELECT ... FOR UPDATE
        .where('s.tipo = :tipo', { tipo })
        .andWhere('s.activo = 1')
        .getOne();

      if (!sec) {
        throw new NotFoundException(
          `No hay secuencia NCF activa para el tipo ${tipo}`,
        );
      }

      const siguiente = Number(sec.secuencia_actual) + 1;
      if (siguiente > Number(sec.secuencia_hasta)) {
        throw new ConflictException(
          `Secuencia NCF agotada para ${tipo}. Solicitar nuevo rango a DGII.`,
        );
      }

      sec.secuencia_actual = siguiente;
      await manager.getRepository(NcfSecuencia).save(sec);

      const numero = String(siguiente).padStart(8, '0');
      return { ncf: `${sec.prefijo}${numero}`, secuencia: siguiente };
    });
    // Al salir del callback sin error, la transaccion hace COMMIT y libera el
    // lock. Si algo lanza, hace ROLLBACK y el NCF no se consume.
  }
}

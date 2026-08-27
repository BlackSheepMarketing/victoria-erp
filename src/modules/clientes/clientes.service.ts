import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';

/**
 * REGLA DE ORO #1 — Paridad de shape de JSON (Handoff §4).
 * La API devuelve exactamente los mismos objetos que devolvia Supabase con
 * `.from('clientes').select('*, vendedores(nombre)')`:
 *   {
 *     id, razon_social, tipo, rnc, ..., vendedor_id,
 *     vendedores: { nombre } | null      <-- join anidado embebido
 *   }
 * Fijate que la clave del embed es `vendedores` (nombre de la tabla en
 * Supabase), NO `vendedor`. Por eso el mapper de abajo renombra la relacion.
 */
@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientes: Repository<Cliente>,
  ) {}

  /** GET /clientes  ->  equivalente a select('*, vendedores(nombre)') */
  async findAll(query: QueryClientesDto) {
    const qb = this.clientes
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.vendedor', 'vendedor')
      .orderBy('c.razon_social', 'ASC');

    if (query.tipo) qb.andWhere('c.tipo = :tipo', { tipo: query.tipo });
    if (query.estado)
      qb.andWhere('c.estado = :estado', { estado: query.estado });
    if (query.vendedor_id)
      qb.andWhere('c.vendedor_id = :vid', { vid: query.vendedor_id });
    if (query.search) {
      qb.andWhere(
        '(c.razon_social LIKE :s OR c.rnc LIKE :s OR c.email LIKE :s OR c.contacto LIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    const rows = await qb.getMany();
    return rows.map((r) => this.toShape(r));
  }

  /** GET /clientes/:id */
  async findOne(id: string) {
    const cliente = await this.clientes.findOne({
      where: { id },
      relations: { vendedor: true, contactos: true },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return this.toShape(cliente, true);
  }

  /** POST /clientes */
  async create(dto: CreateClienteDto) {
    const cliente = this.clientes.create(dto as Partial<Cliente>);
    const guardado = await this.clientes.save(cliente);
    return this.findOne(guardado.id);
  }

  /** PATCH /clientes/:id */
  async update(id: string, dto: UpdateClienteDto) {
    const cliente = await this.clientes.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    Object.assign(cliente, dto);
    await this.clientes.save(cliente);
    return this.findOne(id);
  }

  /** DELETE /clientes/:id */
  async remove(id: string) {
    const res = await this.clientes.delete(id);
    if (!res.affected) throw new NotFoundException('Cliente no encontrado');
    return { id, deleted: true };
  }

  // ── mapper de shape ──────────────────────────────────
  /**
   * Convierte la entidad TypeORM al shape de Supabase:
   * renombra la relacion `vendedor` -> clave `vendedores` (objeto embebido).
   */
  private toShape(cliente: Cliente, incluirContactos = false) {
    const { vendedor, contactos, ...rest } = cliente as any;
    const shaped: Record<string, any> = {
      ...rest,
      vendedores: vendedor ? { nombre: vendedor.nombre } : null,
    };
    if (incluirContactos) shaped.contactos = contactos ?? [];
    return shaped;
  }
}

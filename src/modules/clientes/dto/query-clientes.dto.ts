import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Filtros de listado. Reproducen los filtros de la pantalla de Clientes
 * (por tipo, estado, vendedor, y busqueda por texto).
 */
export class QueryClientesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['Mayorista', 'Institucional', 'Detalle', 'Distribuidor'])
  tipo?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;

  @IsOptional()
  @IsUUID()
  vendedor_id?: string;
}

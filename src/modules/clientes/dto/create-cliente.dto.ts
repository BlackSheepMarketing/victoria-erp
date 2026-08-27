import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @MaxLength(255)
  razon_social: string;

  @IsOptional()
  @IsIn(['Mayorista', 'Institucional', 'Detalle', 'Distribuidor'])
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rnc?: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsUUID()
  vendedor_id?: string;
}

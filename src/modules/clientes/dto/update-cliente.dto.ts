import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';

/** Todos los campos opcionales para PATCH. */
export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

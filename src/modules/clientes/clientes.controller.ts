import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permisos } from '../../common/decorators/roles.decorator';

/**
 * Endpoints de Clientes — plantilla del vertical slice.
 * Toda la autorizacion que antes hacia RLS vive aqui (Guards + @Permisos).
 * Ajusta los codigos de permiso a los que definas en la tabla `permisos`.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  @Permisos('clientes.read')
  findAll(@Query() query: QueryClientesDto) {
    return this.clientes.findAll(query);
  }

  @Get(':id')
  @Permisos('clientes.read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.findOne(id);
  }

  @Post()
  @Permisos('clientes.write')
  create(@Body() dto: CreateClienteDto) {
    return this.clientes.create(dto);
  }

  @Patch(':id')
  @Permisos('clientes.write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientes.update(id, dto);
  }

  @Delete(':id')
  @Permisos('clientes.write')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.remove(id);
  }
}

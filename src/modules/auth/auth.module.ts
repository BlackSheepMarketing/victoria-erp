import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { BootstrapService } from '../../database/bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol, Permiso]),
    PassportModule,
    ConfigModule,
    // El secreto real se pasa por firma en AuthService; aqui solo registramos
    // el modulo para inyectar JwtService.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, BootstrapService],
  exports: [AuthService],
})
export class AuthModule {}

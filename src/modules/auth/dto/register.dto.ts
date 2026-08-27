import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @IsString()
  nombre: string;

  @IsString()
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  password: string;

  /** IDs de roles a asignar. Si se omite, el usuario queda sin roles. */
  @IsOptional()
  rolIds?: string[];
}

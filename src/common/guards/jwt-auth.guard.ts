import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que exige un access token valido. Uso:
 *   @UseGuards(JwtAuthGuard)
 * Se puede aplicar global en AppModule via APP_GUARD; aqui se usa por
 * controller/handler para mantenerlo explicito.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

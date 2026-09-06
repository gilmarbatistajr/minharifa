import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrincipalAutenticado } from '../jwt-payload.interface';

/**
 * Garante que o token pertence a um comprador. Cobre o cenário
 * "Administrador tenta acessar área de cliente" (login-administrador.feature).
 */
@Injectable()
export class CompradorGuard extends AuthGuard('jwt') {
  handleRequest<TUser = PrincipalAutenticado>(
    err: unknown,
    user: PrincipalAutenticado | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user || user.tipo !== 'comprador') {
      throw new UnauthorizedException('Acesso restrito a compradores.');
    }

    return user as unknown as TUser;
  }
}

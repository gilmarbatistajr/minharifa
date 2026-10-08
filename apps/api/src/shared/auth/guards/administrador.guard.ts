import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrincipalAutenticado } from '../jwt-payload.interface';

/**
 * Garante que o token pertence a um administrador. Cobre os cenários
 * "Cliente tenta acessar painel administrativo" (login-administrador.feature).
 */
@Injectable()
export class AdministradorGuard extends AuthGuard('jwt') {
  handleRequest<TUser = PrincipalAutenticado>(
    err: unknown,
    user: PrincipalAutenticado | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user || user.tipo !== 'administrador') {
      throw new UnauthorizedException('Acesso restrito a administradores.');
    }

    return user as unknown as TUser;
  }
}

import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrincipalAutenticado } from '../jwt-payload.interface';

/** Garante que o token pertence a um administrador ou a um operador — usado em ações que ambos os perfis podem realizar. */
@Injectable()
export class AdministradorOuOperadorGuard extends AuthGuard('jwt') {
  handleRequest<TUser = PrincipalAutenticado>(
    err: unknown,
    user: PrincipalAutenticado | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user || (user.tipo !== 'administrador' && user.tipo !== 'operador')) {
      throw new UnauthorizedException('Acesso restrito a administradores ou operadores.');
    }

    return user as unknown as TUser;
  }
}

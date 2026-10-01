import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrincipalAutenticado } from '../jwt-payload.interface';

/** Garante que o token pertence a um operador. */
@Injectable()
export class OperadorGuard extends AuthGuard('jwt') {
  handleRequest<TUser = PrincipalAutenticado>(
    err: unknown,
    user: PrincipalAutenticado | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user || user.tipo !== 'operador') {
      throw new UnauthorizedException('Acesso restrito a operadores.');
    }

    return user as unknown as TUser;
  }
}

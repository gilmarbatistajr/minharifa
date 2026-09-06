import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  gerarTokenAdministrador(administradorId: string): string {
    const payload: JwtPayload = { sub: administradorId, tipo: 'administrador' };
    return this.jwtService.sign(payload);
  }

  gerarTokenComprador(compradorId: string, grupoId: string): string {
    const payload: JwtPayload = { sub: compradorId, tipo: 'comprador', grupoId };
    return this.jwtService.sign(payload);
  }
}

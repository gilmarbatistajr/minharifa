import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, PrincipalAutenticado } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'troque-por-um-segredo-forte-em-producao',
    });
  }

  validate(payload: JwtPayload): PrincipalAutenticado {
    return {
      tipo: payload.tipo,
      administradorId: payload.tipo === 'administrador' ? payload.sub : undefined,
      compradorId: payload.tipo === 'comprador' ? payload.sub : undefined,
      grupoId: payload.grupoId,
    };
  }
}

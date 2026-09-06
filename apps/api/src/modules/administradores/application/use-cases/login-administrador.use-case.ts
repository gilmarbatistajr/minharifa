import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenService } from '../../../../shared/auth/token.service';

export interface LoginAdministradorInput {
  email: string;
  senha: string;
}

export interface LoginAdministradorOutput {
  token: string;
  administradorId: string;
  nome: string;
  emailConfirmado: boolean;
}

@Injectable()
export class LoginAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async executar(input: LoginAdministradorInput): Promise<LoginAdministradorOutput> {
    const administrador = await this.administradorRepository.buscarPorEmail(input.email);

    if (!administrador) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const senhaValida = await this.passwordHasher.comparar(input.senha, administrador.senhaHash);

    if (!senhaValida) {
      throw new Error('E-mail ou senha inválidos.');
    }

    return {
      token: this.tokenService.gerarTokenAdministrador(administrador.id),
      administradorId: administrador.id,
      nome: administrador.nome,
      emailConfirmado: administrador.emailConfirmado,
    };
  }
}

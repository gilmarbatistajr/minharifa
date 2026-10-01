import { Inject, Injectable } from '@nestjs/common';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../domain/repositories/operador.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenService } from '../../../../shared/auth/token.service';

export interface LoginOperadorInput {
  login: string;
  senha: string;
}

export interface LoginOperadorOutput {
  token: string;
  operadorId: string;
  nomeCompleto: string;
}

@Injectable()
export class LoginOperadorUseCase {
  constructor(
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async executar(input: LoginOperadorInput): Promise<LoginOperadorOutput> {
    const operador = await this.operadorRepository.buscarPorLogin(input.login);

    if (!operador) {
      throw new Error('Login ou senha inválidos.');
    }

    const senhaValida = await this.passwordHasher.comparar(input.senha, operador.senhaHash);

    if (!senhaValida) {
      throw new Error('Login ou senha inválidos.');
    }

    return {
      token: this.tokenService.gerarTokenOperador(operador.id),
      operadorId: operador.id,
      nomeCompleto: operador.nomeCompleto,
    };
  }
}

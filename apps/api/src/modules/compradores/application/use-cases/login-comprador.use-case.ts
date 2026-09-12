import { Inject, Injectable } from '@nestjs/common';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../domain/repositories/comprador.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenService } from '../../../../shared/auth/token.service';

export interface LoginCompradorInput {
  email: string;
  senha: string;
}

export interface LoginCompradorOutput {
  token: string;
  compradorId: string;
  nome: string;
}

/**
 * Cobre login-cliente.feature: "Login com e-mail e senha válidos" e
 * "Login com senha incorreta".
 */
@Injectable()
export class LoginCompradorUseCase {
  constructor(
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async executar(input: LoginCompradorInput): Promise<LoginCompradorOutput> {
    const comprador = await this.compradorRepository.buscarPorEmail(input.email);

    if (!comprador || !comprador.senhaHash) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const senhaValida = await this.passwordHasher.comparar(input.senha, comprador.senhaHash);

    if (!senhaValida) {
      throw new Error('E-mail ou senha inválidos.');
    }

    return {
      token: this.tokenService.gerarTokenComprador(comprador.id, comprador.grupoId),
      compradorId: comprador.id,
      nome: comprador.nome,
    };
  }
}

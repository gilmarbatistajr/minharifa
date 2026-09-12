import { Inject, Injectable } from '@nestjs/common';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../domain/repositories/comprador.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';

export interface RedefinirSenhaCompradorInput {
  token: string;
  novaSenha: string;
}

/**
 * Cobre login-cliente.feature: "Redefinição de senha através do link
 * recebido por e-mail" e "Tentativa de uso de um link de redefinição de
 * senha expirado".
 */
@Injectable()
export class RedefinirSenhaCompradorUseCase {
  constructor(
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(input: RedefinirSenhaCompradorInput, agora: Date = new Date()): Promise<void> {
    const comprador = await this.compradorRepository.buscarPorTokenRecuperacaoSenha(input.token);

    if (!comprador) {
      throw new Error('Link de redefinição de senha inválido.');
    }

    const novoHash = await this.passwordHasher.hash(input.novaSenha);
    comprador.redefinirSenha(input.token, novoHash, agora);

    await this.compradorRepository.salvar(comprador);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';

export interface RedefinirSenhaAdministradorInput {
  token: string;
  novaSenha: string;
}

@Injectable()
export class RedefinirSenhaAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(input: RedefinirSenhaAdministradorInput, agora: Date = new Date()): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorTokenRecuperacaoSenha(
      input.token,
    );

    if (!administrador) {
      throw new Error('Link de redefinição de senha inválido.');
    }

    const novoHash = await this.passwordHasher.hash(input.novaSenha);
    administrador.redefinirSenha(input.token, novoHash, agora);

    await this.administradorRepository.salvar(administrador);
  }
}

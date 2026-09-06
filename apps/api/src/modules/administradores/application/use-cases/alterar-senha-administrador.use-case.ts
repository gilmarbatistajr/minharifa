import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';

export interface AlterarSenhaAdministradorInput {
  administradorId: string;
  senhaAtual: string;
  novaSenha: string;
}

@Injectable()
export class AlterarSenhaAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(input: AlterarSenhaAdministradorInput): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorId(input.administradorId);

    if (!administrador) {
      throw new Error('Administrador não encontrado.');
    }

    const senhaAtualCorreta = await this.passwordHasher.comparar(
      input.senhaAtual,
      administrador.senhaHash,
    );

    if (!senhaAtualCorreta) {
      throw new Error('Senha atual incorreta.');
    }

    const novoHash = await this.passwordHasher.hash(input.novaSenha);
    administrador.trocarSenha(novoHash);

    await this.administradorRepository.salvar(administrador);
  }
}

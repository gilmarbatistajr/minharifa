import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';

export interface ConfirmarEmailAdministradorInput {
  token: string;
}

@Injectable()
export class ConfirmarEmailAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(input: ConfirmarEmailAdministradorInput, agora: Date = new Date()): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorTokenConfirmacaoEmail(
      input.token,
    );

    if (!administrador) {
      throw new Error('Token de confirmação de e-mail inválido.');
    }

    administrador.confirmarEmail(input.token, agora);

    await this.administradorRepository.salvar(administrador);
  }
}

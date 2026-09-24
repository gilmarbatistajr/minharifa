import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';

export interface ConfirmarNovoEmailAdministradorInput {
  token: string;
}

@Injectable()
export class ConfirmarNovoEmailAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(
    input: ConfirmarNovoEmailAdministradorInput,
    agora: Date = new Date(),
  ): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorTokenConfirmacaoNovoEmail(
      input.token,
    );

    if (!administrador) {
      throw new Error('Token de confirmação de e-mail inválido.');
    }

    administrador.confirmarNovoEmail(input.token, agora);

    await this.administradorRepository.salvar(administrador);
  }
}

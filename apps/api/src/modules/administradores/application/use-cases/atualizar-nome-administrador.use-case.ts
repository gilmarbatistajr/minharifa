import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';

export interface AtualizarNomeAdministradorInput {
  administradorId: string;
  nome: string;
}

@Injectable()
export class AtualizarNomeAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(input: AtualizarNomeAdministradorInput): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorId(input.administradorId);

    if (!administrador) {
      throw new Error('Administrador não encontrado.');
    }

    administrador.atualizarNome(input.nome);

    await this.administradorRepository.salvar(administrador);
  }
}

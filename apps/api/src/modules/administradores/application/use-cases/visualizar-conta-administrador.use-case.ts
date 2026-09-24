import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';

export interface VisualizarContaAdministradorInput {
  administradorId: string;
}

export interface VisualizarContaAdministradorOutput {
  nome: string;
  email: string;
  emailConfirmado: boolean;
  criadoEm: Date;
}

/** Cobre conta-administrador.feature: "Visualizar dados da conta". */
@Injectable()
export class VisualizarContaAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(
    input: VisualizarContaAdministradorInput,
  ): Promise<VisualizarContaAdministradorOutput> {
    const administrador = await this.administradorRepository.buscarPorId(input.administradorId);

    if (!administrador) {
      throw new Error('Administrador não encontrado.');
    }

    return {
      nome: administrador.nome,
      email: administrador.email,
      emailConfirmado: administrador.emailConfirmado,
      criadoEm: administrador.criadoEm,
    };
  }
}

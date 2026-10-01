import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';

export interface ExcluirAdministradorMembroInput {
  administradorId: string;
  membroId: string;
}

/** Cobre cadastro-de-administrador-membro.feature: exclusão de um membro pelo dono da conta. */
@Injectable()
export class ExcluirAdministradorMembroUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(input: ExcluirAdministradorMembroInput): Promise<void> {
    const solicitante = await this.administradorRepository.buscarPorId(input.administradorId);
    const membro = await this.administradorRepository.buscarPorId(input.membroId);

    if (!solicitante || !membro || !membro.ehMembro() || !membro.pertenceAMesmaConta(solicitante.contaId())) {
      throw new Error('Administrador não encontrado.');
    }

    await this.administradorRepository.remover(membro.id);
  }
}

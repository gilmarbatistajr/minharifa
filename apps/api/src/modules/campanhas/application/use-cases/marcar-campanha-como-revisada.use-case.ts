import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';

export interface MarcarCampanhaComoRevisadaInput {
  administradorId: string;
  campanhaId: string;
}

/** Cobre a transição NOVO → AGUARDANDO_LIBERACAO, após o administrador revisar o conteúdo. */
@Injectable()
export class MarcarCampanhaComoRevisadaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: MarcarCampanhaComoRevisadaInput): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    campanha.marcarComoRevisada();

    await this.campanhaRepository.salvar(campanha);
  }
}

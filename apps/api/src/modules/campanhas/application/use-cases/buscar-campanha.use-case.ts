import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Campanha } from '../../domain/entities/campanha.entity';

export interface BuscarCampanhaInput {
  administradorId: string;
  campanhaId: string;
}

/** Cobre a tela de detalhe da campanha (novo → aguardando liberação → liberada → finalizada). */
@Injectable()
export class BuscarCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: BuscarCampanhaInput): Promise<Campanha> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    return campanha;
  }
}

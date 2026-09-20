import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';

export interface RestaurarCampanhaInput {
  administradorId: string;
  campanhaId: string;
}

@Injectable()
export class RestaurarCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: RestaurarCampanhaInput): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    campanha.restaurar();

    await this.campanhaRepository.salvar(campanha);
  }
}

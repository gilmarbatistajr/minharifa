import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';

export interface RemoverCampanhaInput {
  administradorId: string;
  campanhaId: string;
}

/** Remoção lógica: a campanha some das ações do dia a dia, mas continua na listagem do administrador. */
@Injectable()
export class RemoverCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: RemoverCampanhaInput, agora: Date = new Date()): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    campanha.remover(agora);

    await this.campanhaRepository.salvar(campanha);
  }
}

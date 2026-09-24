import { Inject, Injectable } from '@nestjs/common';
import { PREMIO_REPOSITORY, PremioRepository } from '../../domain/repositories/premio.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import { STATUS_VENDAS_EM_ANDAMENTO } from '../../domain/services/vinculo-campanha-premio';

export interface ExcluirPremioInput {
  administradorId: string;
  premioId: string;
}

/**
 * Cobre cadastro-de-premio.feature: remoção definitiva de um prêmio (ao
 * contrário da campanha, não existe remoção lógica aqui) — bloqueada
 * enquanto o prêmio estiver vinculado a uma campanha em andamento.
 */
@Injectable()
export class ExcluirPremioUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: ExcluirPremioInput): Promise<void> {
    const premio = await this.premioRepository.buscarPorId(input.premioId);

    if (!premio || !premio.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Prêmio não encontrado.');
    }

    const campanhasVinculadas = await this.campanhaRepository.listarPorPremioId(input.premioId);

    if (campanhasVinculadas.some((campanha) => STATUS_VENDAS_EM_ANDAMENTO.includes(campanha.statusVendas))) {
      throw new Error('O prêmio não pode ser removido enquanto estiver vinculado a uma campanha em andamento.');
    }

    await this.premioRepository.remover(premio.id);
  }
}

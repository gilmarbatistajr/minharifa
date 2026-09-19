import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';

export interface FinalizarCampanhaInput {
  administradorId: string;
  campanhaId: string;
  cotaVencedoraNumero: number;
}

export interface FinalizarCampanhaOutput {
  campanhaId: string;
  compradorVencedorId: string;
}

/**
 * Permite ao administrador registrar o vencedor de uma campanha já
 * realizada, informando o número da cota vencedora. Alimenta o ranking de
 * vencedores.
 */
@Injectable()
export class FinalizarCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(
    input: FinalizarCampanhaInput,
    agora: Date = new Date(),
  ): Promise<FinalizarCampanhaOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotaVencedora = await this.cotaRepository.buscarPorCampanhaENumero(
      input.campanhaId,
      input.cotaVencedoraNumero,
    );
    if (!cotaVencedora || cotaVencedora.status !== 'PAGA' || !cotaVencedora.compradorId) {
      throw new Error('A cota vencedora precisa ser uma cota paga por um comprador.');
    }

    campanha.finalizar(input.cotaVencedoraNumero, agora);
    await this.campanhaRepository.salvar(campanha);

    return { campanhaId: campanha.id, compradorVencedorId: cotaVencedora.compradorId };
  }
}

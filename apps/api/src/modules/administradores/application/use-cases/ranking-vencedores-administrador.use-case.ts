import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';
import { RankingItem, MEDALHAS, TAMANHO_RANKING } from '../../../../shared/domain/ranking';

export interface RankingVencedoresAdministradorInput {
  administradorId: string;
}

/**
 * Top 3 compradores que mais ganharam campanhas finalizadas, considerando
 * todos os grupos do administrador. Alimenta o dashboard.
 */
@Injectable()
export class RankingVencedoresAdministradorUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
  ) {}

  async executar(input: RankingVencedoresAdministradorInput): Promise<RankingItem[]> {
    const campanhas = await this.campanhaRepository.listarPorAdministrador(input.administradorId);
    const finalizadas = campanhas.filter(
      (campanha) => campanha.status === 'FINALIZADA' && campanha.cotaVencedoraNumero !== null,
    );

    const vitoriasPorComprador = new Map<string, number>();
    for (const campanha of finalizadas) {
      const cotaVencedora = await this.cotaRepository.buscarPorCampanhaENumero(
        campanha.id,
        campanha.cotaVencedoraNumero as number,
      );
      if (cotaVencedora?.compradorId) {
        vitoriasPorComprador.set(
          cotaVencedora.compradorId,
          (vitoriasPorComprador.get(cotaVencedora.compradorId) ?? 0) + 1,
        );
      }
    }

    const top = Array.from(vitoriasPorComprador.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TAMANHO_RANKING);

    const itens: RankingItem[] = [];
    for (let indice = 0; indice < top.length; indice += 1) {
      const [compradorId, quantidade] = top[indice];
      const comprador = await this.compradorRepository.buscarPorId(compradorId);
      itens.push({
        posicao: indice + 1,
        medalha: MEDALHAS[indice],
        compradorId,
        nome: comprador?.nome ?? 'Comprador removido',
        quantidade,
      });
    }

    return itens;
  }
}

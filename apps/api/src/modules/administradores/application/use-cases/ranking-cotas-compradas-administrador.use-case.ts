import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';
import { RankingItem, MEDALHAS, TAMANHO_RANKING } from '../../../../shared/domain/ranking';

export interface RankingCotasCompradasAdministradorInput {
  administradorId: string;
}

/**
 * Top 3 compradores que mais compraram cotas (pagas), considerando todos os
 * grupos do administrador. Alimenta o dashboard.
 */
@Injectable()
export class RankingCotasCompradasAdministradorUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
  ) {}

  async executar(input: RankingCotasCompradasAdministradorInput): Promise<RankingItem[]> {
    const contagens = await this.cotaRepository.contarPagasAgrupadoPorCompradorDoAdministrador(
      input.administradorId,
    );

    const top = contagens.slice().sort((a, b) => b.quantidade - a.quantidade).slice(0, TAMANHO_RANKING);

    const itens: RankingItem[] = [];
    for (let indice = 0; indice < top.length; indice += 1) {
      const item = top[indice];
      const comprador = await this.compradorRepository.buscarPorId(item.compradorId);
      itens.push({
        posicao: indice + 1,
        medalha: MEDALHAS[indice],
        compradorId: item.compradorId,
        nome: comprador?.nome ?? 'Comprador removido',
        quantidade: item.quantidade,
      });
    }

    return itens;
  }
}

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
import { RankingVencedorItem, MEDALHAS, TAMANHO_RANKING } from '../../../../shared/domain/ranking';

export interface RankingVencedoresAdministradorInput {
  administradorId: string;
}

interface DadosVencedor {
  nome: string | null;
  telefone: string | null;
}

/**
 * Top 3 compradores que mais ganharam campanhas finalizadas, considerando
 * todos os grupos do administrador. Alimenta o dashboard. Nome e telefone
 * exibidos são os preenchidos manualmente ao finalizar a campanha (ver
 * `Campanha.finalizar`); se a campanha for de antes dessa mudança e não
 * tiver esses dados, cai de volta no cadastro do comprador.
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

  async executar(input: RankingVencedoresAdministradorInput): Promise<RankingVencedorItem[]> {
    const campanhas = await this.campanhaRepository.listarPorAdministrador(input.administradorId);
    const finalizadas = campanhas.filter(
      (campanha) => campanha.status === 'FINALIZADA' && campanha.cotaVencedoraNumero !== null,
    );

    const vitoriasPorComprador = new Map<string, number>();
    const dadosVencedorPorComprador = new Map<string, DadosVencedor>();
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
        dadosVencedorPorComprador.set(cotaVencedora.compradorId, {
          nome: campanha.vencedorNome,
          telefone: campanha.vencedorTelefone,
        });
      }
    }

    const top = Array.from(vitoriasPorComprador.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TAMANHO_RANKING);

    const itens: RankingVencedorItem[] = [];
    for (let indice = 0; indice < top.length; indice += 1) {
      const [compradorId, quantidade] = top[indice];
      const comprador = await this.compradorRepository.buscarPorId(compradorId);
      const dadosVencedor = dadosVencedorPorComprador.get(compradorId);
      itens.push({
        posicao: indice + 1,
        medalha: MEDALHAS[indice],
        compradorId,
        nome: dadosVencedor?.nome ?? comprador?.nome ?? 'Comprador removido',
        telefone: dadosVencedor?.telefone ?? comprador?.telefone ?? '',
        quantidade,
      });
    }

    return itens;
  }
}

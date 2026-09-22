import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import { RankingVencedorItem, MEDALHAS, TAMANHO_RANKING } from '../../../../shared/domain/ranking';

export interface RankingVencedoresInput {
  administradorId: string;
  grupoId: string;
}

interface DadosVencedor {
  nome: string | null;
  telefone: string | null;
}

/**
 * Top 3 compradores que mais ganharam campanhas finalizadas no grupo, com
 * medalhas. Nome e telefone exibidos são os preenchidos manualmente ao
 * finalizar a campanha (ver `Campanha.finalizar`); campanhas antigas sem
 * esses dados caem de volta no cadastro do comprador.
 */
@Injectable()
export class RankingVencedoresUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: RankingVencedoresInput): Promise<RankingVencedorItem[]> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const campanhas = await this.campanhaRepository.listarPorGrupo(input.grupoId);
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

    const compradores = await this.grupoRepository.listarCompradores(input.grupoId);
    const compradoresPorId = new Map(compradores.map((comprador) => [comprador.id, comprador]));

    return Array.from(vitoriasPorComprador.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TAMANHO_RANKING)
      .map(([compradorId, quantidade], indice) => {
        const comprador = compradoresPorId.get(compradorId);
        const dadosVencedor = dadosVencedorPorComprador.get(compradorId);
        return {
          posicao: indice + 1,
          medalha: MEDALHAS[indice],
          compradorId,
          nome: dadosVencedor?.nome ?? comprador?.nome ?? 'Comprador removido',
          telefone: dadosVencedor?.telefone ?? comprador?.telefone ?? '',
          quantidade,
        };
      });
  }
}

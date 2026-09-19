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
import { RankingItem, MEDALHAS, TAMANHO_RANKING } from '../../../../shared/domain/ranking';

export interface RankingVencedoresInput {
  administradorId: string;
  grupoId: string;
}

/** Top 3 compradores que mais ganharam campanhas finalizadas no grupo, com medalhas. */
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

  async executar(input: RankingVencedoresInput): Promise<RankingItem[]> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const campanhas = await this.campanhaRepository.listarPorGrupo(input.grupoId);
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

    const compradores = await this.grupoRepository.listarCompradores(input.grupoId);
    const nomesPorId = new Map(compradores.map((comprador) => [comprador.id, comprador.nome]));

    return Array.from(vitoriasPorComprador.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TAMANHO_RANKING)
      .map(([compradorId, quantidade], indice) => ({
        posicao: indice + 1,
        medalha: MEDALHAS[indice],
        compradorId,
        nome: nomesPorId.get(compradorId) ?? 'Comprador removido',
        quantidade,
      }));
  }
}

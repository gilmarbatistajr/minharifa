import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import { RankingItem, MEDALHAS, TAMANHO_RANKING } from '../../../../shared/domain/ranking';

export interface RankingCotasCompradasInput {
  administradorId: string;
  grupoId: string;
}

/** Top 3 compradores que mais compraram cotas (pagas) no grupo, com medalhas. */
@Injectable()
export class RankingCotasCompradasUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: RankingCotasCompradasInput): Promise<RankingItem[]> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const contagens = await this.cotaRepository.contarPagasAgrupadoPorComprador(input.grupoId);
    const compradores = await this.grupoRepository.listarCompradores(input.grupoId);
    const nomesPorId = new Map(compradores.map((comprador) => [comprador.id, comprador.nome]));

    return contagens
      .slice()
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, TAMANHO_RANKING)
      .map((item, indice) => ({
        posicao: indice + 1,
        medalha: MEDALHAS[indice],
        compradorId: item.compradorId,
        nome: nomesPorId.get(item.compradorId) ?? 'Comprador removido',
        quantidade: item.quantidade,
      }));
  }
}

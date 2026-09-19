import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { StatusCota } from '../../domain/entities/cota.entity';

export interface ListarCotasDaCampanhaInput {
  campanhaId: string;
  grupoId: string;
  compradorId: string;
}

export interface CotaResumo {
  numero: number;
  status: StatusCota;
  minhaCota: boolean;
}

/**
 * Cobre a tela "Escolha sua cota": mapa com o status de cada número de
 * 1..quantidadeCotas. Nunca expõe de quem é a cota — só se é "minha" ou não,
 * para não vazar dados de outros compradores.
 */
@Injectable()
export class ListarCotasDaCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: ListarCotasDaCampanhaInput): Promise<CotaResumo[]> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.grupoId !== input.grupoId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);

    return cotas
      .map((cota) => ({
        numero: cota.numero,
        status: cota.status,
        minhaCota: cota.compradorId === input.compradorId,
      }))
      .sort((a, b) => a.numero - b.numero);
  }
}

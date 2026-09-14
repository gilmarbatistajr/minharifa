import { Inject, Injectable } from '@nestjs/common';
import { SORTEIO_REPOSITORY, SorteioRepository } from '../../domain/repositories/sorteio.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { StatusCota } from '../../domain/entities/cota.entity';

export interface ListarCotasDoSorteioInput {
  sorteioId: string;
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
export class ListarCotasDoSorteioUseCase {
  constructor(
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: ListarCotasDoSorteioInput): Promise<CotaResumo[]> {
    const sorteio = await this.sorteioRepository.buscarPorId(input.sorteioId);

    if (!sorteio || sorteio.grupoId !== input.grupoId) {
      throw new Error('Sorteio não encontrado.');
    }

    const cotas = await this.cotaRepository.listarPorSorteio(input.sorteioId);

    return cotas
      .map((cota) => ({
        numero: cota.numero,
        status: cota.status,
        minhaCota: cota.compradorId === input.compradorId,
      }))
      .sort((a, b) => a.numero - b.numero);
  }
}

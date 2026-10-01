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
  reservaExpiraEm: Date | null;
}

/**
 * Cobre a tela "Escolha sua cota": mapa com o status de cada número de
 * 1..quantidadeCotas. Nunca expõe de quem é a cota — só se é "minha" ou não,
 * para não vazar dados de outros compradores.
 *
 * Uma cota RESERVADA cuja `reservaExpiraEm` já passou é reportada aqui como
 * DISPONIVEL (a liberação em si só acontece de fato quando alguém tenta
 * reservá-la de novo — mesmo padrão lazy de `Cota.podeSerReservadaPor`), para
 * que o comprador sempre veja o mapa real de disponibilidade.
 */
@Injectable()
export class ListarCotasDaCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: ListarCotasDaCampanhaInput, agora: Date = new Date()): Promise<CotaResumo[]> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.grupoId !== input.grupoId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);

    return cotas
      .map((cota) => {
        const reservaExpirada = cota.status === 'RESERVADA' && cota.podeSerReservadaPor(agora);
        return {
          numero: cota.numero,
          status: reservaExpirada ? ('DISPONIVEL' as StatusCota) : cota.status,
          minhaCota: !reservaExpirada && cota.compradorId === input.compradorId,
          reservaExpiraEm: !reservaExpirada && cota.status === 'RESERVADA' ? cota.reservaExpiraEm : null,
        };
      })
      .sort((a, b) => a.numero - b.numero);
  }
}

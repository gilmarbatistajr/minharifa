import { Inject, Injectable } from '@nestjs/common';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { resolverCotasParaReservar } from '../services/resolver-cotas-para-reservar';

export interface ReservarLoteCotasInput {
  campanhaId: string;
  grupoId: string;
  compradorId: string;
  numeros?: number[];
  quantidadeAleatoria?: number;
}

export interface ReservarLoteCotasOutput {
  numeros: number[];
  reservaExpiraEm: Date | null;
}

/**
 * Cobre a tela "Escolha sua cota": reserva várias cotas de uma vez, seja
 * por números escolhidos manualmente, seja por uma quantidade aleatória
 * dentro das cotas disponíveis (compra em lote).
 */
@Injectable()
export class ReservarLoteCotasUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(
    input: ReservarLoteCotasInput,
    agora: Date = new Date(),
  ): Promise<ReservarLoteCotasOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.grupoId !== input.grupoId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotasParaReservar = await resolverCotasParaReservar(
      this.cotaRepository,
      campanha,
      input.numeros,
      input.quantidadeAleatoria,
      agora,
    );

    for (const cota of cotasParaReservar) {
      cota.reservarPara(input.compradorId, agora, campanha.expiracaoReservaMinutos);
    }

    for (const cota of cotasParaReservar) {
      await this.cotaRepository.salvar(cota);
    }

    return {
      numeros: cotasParaReservar.map((cota) => cota.numero).sort((a, b) => a - b),
      reservaExpiraEm: cotasParaReservar[0].reservaExpiraEm,
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';

export interface FinalizarCompraConvidadoInput {
  campanhaId: string;
  numerosCotas: number[];
  tokenReservaConvidado: string;
}

/** Mesma regra de `FinalizarCompraUseCase`, para quem comprou sem login. */
@Injectable()
export class FinalizarCompraConvidadoUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async executar(input: FinalizarCompraConvidadoInput, agora: Date = new Date()): Promise<void> {
    for (const numero of input.numerosCotas) {
      const cota = await this.cotaRepository.buscarPorCampanhaENumero(input.campanhaId, numero);
      if (!cota || cota.tokenReservaConvidado !== input.tokenReservaConvidado) {
        throw new Error(`Cota ${numero} não pertence a essa reserva nesta campanha.`);
      }

      const pagamento = await this.pagamentoRepository.buscarPorCotaId(cota.id);
      if (!pagamento) {
        throw new Error(`Cota ${numero} ainda não tem uma cobrança gerada.`);
      }

      pagamento.marcarFinalizadoPeloComprador(agora);
      await this.pagamentoRepository.salvar(pagamento);
    }
  }
}

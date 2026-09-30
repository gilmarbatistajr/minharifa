import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';

export interface FinalizarCompraInput {
  campanhaId: string;
  numerosCotas: number[];
  compradorId: string;
}

/**
 * Registra quando o comprador clicou em "Finalizar compra" na tela de
 * pagamento — puramente informativo pro administrador (ver "Cotas
 * compradas"), não confunde com a confirmação de recebimento (manual, feita
 * pelo administrador) nem muda o status da cota.
 */
@Injectable()
export class FinalizarCompraUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async executar(input: FinalizarCompraInput, agora: Date = new Date()): Promise<void> {
    for (const numero of input.numerosCotas) {
      const cota = await this.cotaRepository.buscarPorCampanhaENumero(input.campanhaId, numero);
      if (!cota || cota.compradorId !== input.compradorId) {
        throw new Error(`Cota ${numero} não pertence a você nesta campanha.`);
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

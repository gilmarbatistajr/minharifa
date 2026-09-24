import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { resolverCotasElegiveisParaPagamento } from '../services/resolver-cotas-elegiveis-pagamento';
import { atualizarStatusCampanhaAposPagamento } from '../../../campanhas/application/services/atualizar-status-apos-pagamento';

export interface PagarComCashbackInput {
  campanhaId: string;
  numerosCotas: number[];
  compradorId: string;
}

export interface PagarComCashbackOutput {
  pagoIntegralmente: boolean;
  valorAbatido: number;
  valorRestante: number;
}

/**
 * Cobre pagamento-de-cota.feature: "Pagamento de uma cota usando cashback
 * disponível" e "Cashback insuficiente para cobrir o valor total da cota".
 * O abatimento é calculado sobre a soma de todas as cotas reservadas (ver
 * `resolverCotasElegiveisParaPagamento`) e distribuído entre elas — nenhuma
 * cota é confirmada como paga a menos que o cashback cubra o valor em
 * aberto de TODAS elas, evitando que só parte do lote seja quitada.
 */
@Injectable()
export class PagarComCashbackUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async executar(input: PagarComCashbackInput, agora: Date = new Date()): Promise<PagarComCashbackOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha) {
      throw new Error('Campanha não encontrada.');
    }

    const comprador = await this.compradorRepository.buscarPorId(input.compradorId);
    if (!comprador) {
      throw new Error('Comprador não encontrado.');
    }

    const cotas = await resolverCotasElegiveisParaPagamento(
      this.cotaRepository,
      input.campanhaId,
      input.compradorId,
      input.numerosCotas,
      agora,
    );

    const itens = await Promise.all(
      cotas.map(async (cota) => {
        const pagamentoExistente = await this.pagamentoRepository.buscarPorCotaId(cota.id);
        const valorTotal = pagamentoExistente ? pagamentoExistente.valor : campanha.valorCota;
        const valorJaAplicado = pagamentoExistente ? pagamentoExistente.valorCashbackAplicado : 0;
        return { cota, pagamentoExistente, valorTotal, valorEmAberto: valorTotal - valorJaAplicado };
      }),
    );

    const valorEmAbertoTotal = itens.reduce((total, item) => total + item.valorEmAberto, 0);
    const valorAbatidoTotal = Math.min(comprador.cashbackDisponivel, valorEmAbertoTotal);

    if (valorAbatidoTotal > 0) {
      comprador.debitarCashback(valorAbatidoTotal);
      await this.compradorRepository.salvar(comprador);
    }

    const valorRestanteTotal = valorEmAbertoTotal - valorAbatidoTotal;
    const pagoIntegralmente = valorRestanteTotal <= 0;

    let restanteParaDistribuir = valorAbatidoTotal;
    for (const item of itens) {
      const abatidoNestaCota = Math.min(item.valorEmAberto, restanteParaDistribuir);
      restanteParaDistribuir -= abatidoNestaCota;
      const valorJaAplicado = item.pagamentoExistente ? item.pagamentoExistente.valorCashbackAplicado : 0;
      const valorCashbackTotalAplicado = valorJaAplicado + abatidoNestaCota;

      if (item.pagamentoExistente) {
        item.pagamentoExistente.valorCashbackAplicado = valorCashbackTotalAplicado;
        if (pagoIntegralmente) {
          item.pagamentoExistente.metodo = 'CASHBACK';
          item.pagamentoExistente.aprovar();
        }
        await this.pagamentoRepository.salvar(item.pagamentoExistente);
      } else {
        const pagamento = new Pagamento(
          randomUUID(),
          item.cota.id,
          input.compradorId,
          item.valorTotal,
          valorCashbackTotalAplicado,
          'CASHBACK',
          pagoIntegralmente ? 'APROVADO' : 'PENDENTE',
          null,
          agora,
        );
        await this.pagamentoRepository.criar(pagamento);
      }

      if (pagoIntegralmente) {
        item.cota.confirmarPagamento();
        await this.cotaRepository.salvar(item.cota);
      }
    }

    if (pagoIntegralmente) {
      await atualizarStatusCampanhaAposPagamento(this.campanhaRepository, this.cotaRepository, campanha);
    }

    return {
      pagoIntegralmente,
      valorAbatido: valorAbatidoTotal,
      valorRestante: Math.max(valorRestanteTotal, 0),
    };
  }
}

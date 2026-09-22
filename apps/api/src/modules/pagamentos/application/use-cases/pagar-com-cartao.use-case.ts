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
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { DadosCartao, PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import { resolverCotasElegiveisParaPagamento } from '../services/resolver-cotas-elegiveis-pagamento';

export interface PagarComCartaoInput {
  campanhaId: string;
  numerosCotas: number[];
  compradorId: string;
  dadosCartao: DadosCartao;
}

export interface PagarComCartaoOutput {
  status: 'APROVADO' | 'RECUSADO';
}

/**
 * Cobre pagamento-de-cota.feature: "Geração de cobrança via cartão de
 * crédito", "Cartão de crédito aprovado dentro do prazo" e "Cartão de
 * crédito recusado". Cobra o valor total das cotas reservadas numa única
 * transação: aprova ou recusa todas juntas (ver
 * `resolverCotasElegiveisParaPagamento`) — nunca aprova só parte delas.
 */
@Injectable()
export class PagarComCartaoUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async executar(input: PagarComCartaoInput, agora: Date = new Date()): Promise<PagarComCartaoOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha) {
      throw new Error('Campanha não encontrada.');
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
        const valorRestante = pagamentoExistente ? pagamentoExistente.calcularValorRestante() : campanha.valorCota;
        return { cota, pagamentoExistente, valorRestante };
      }),
    );

    const valorTotalRestante = itens.reduce((total, item) => total + item.valorRestante, 0);
    if (valorTotalRestante <= 0) {
      throw new Error('Essas cotas já estão totalmente pagas.');
    }

    const referencia = cotas.map((cota) => cota.id).join(',');
    const cobranca = await this.paymentGateway.gerarCobrancaCartao(
      valorTotalRestante,
      referencia,
      input.dadosCartao,
    );

    for (const item of itens) {
      const pagamento =
        item.pagamentoExistente ??
        new Pagamento(
          randomUUID(),
          item.cota.id,
          input.compradorId,
          campanha.valorCota,
          0,
          'CARTAO_CREDITO',
          'PENDENTE',
          null,
          agora,
        );

      pagamento.atualizarCobranca('CARTAO_CREDITO', cobranca.transacaoId);

      if (cobranca.aprovado) {
        pagamento.aprovar();
        item.cota.confirmarPagamento();
        await this.cotaRepository.salvar(item.cota);
      } else {
        pagamento.recusar();
      }

      if (item.pagamentoExistente) {
        await this.pagamentoRepository.salvar(pagamento);
      } else {
        await this.pagamentoRepository.criar(pagamento);
      }
    }

    return { status: cobranca.aprovado ? 'APROVADO' : 'RECUSADO' };
  }
}

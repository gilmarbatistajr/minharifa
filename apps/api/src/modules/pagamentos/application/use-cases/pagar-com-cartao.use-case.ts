import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../sorteios/domain/repositories/cota.repository';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { DadosCartao, PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';

export interface PagarComCartaoInput {
  sorteioId: string;
  numeroCota: number;
  compradorId: string;
  dadosCartao: DadosCartao;
}

export interface PagarComCartaoOutput {
  status: 'APROVADO' | 'RECUSADO';
}

/**
 * Cobre pagamento-de-cota.feature: "Geração de cobrança via cartão de
 * crédito", "Cartão de crédito aprovado dentro do prazo" e "Cartão de
 * crédito recusado" (a cota permanece reservada para nova tentativa).
 */
@Injectable()
export class PagarComCartaoUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async executar(input: PagarComCartaoInput, agora: Date = new Date()): Promise<PagarComCartaoOutput> {
    const cota = await this.cotaRepository.buscarPorSorteioENumero(input.sorteioId, input.numeroCota);

    if (
      !cota ||
      cota.status !== 'RESERVADA' ||
      cota.compradorId !== input.compradorId ||
      (cota.reservaExpiraEm && agora > cota.reservaExpiraEm)
    ) {
      throw new Error('Esta cota não está reservada para você.');
    }

    const sorteio = await this.sorteioRepository.buscarPorId(input.sorteioId);
    if (!sorteio) {
      throw new Error('Sorteio não encontrado.');
    }

    const pagamentoExistente = await this.pagamentoRepository.buscarPorCotaId(cota.id);
    const valorRestante = pagamentoExistente ? pagamentoExistente.calcularValorRestante() : sorteio.valorCota;

    if (valorRestante <= 0) {
      throw new Error('Esta cota já está totalmente paga.');
    }

    const cobranca = await this.paymentGateway.gerarCobrancaCartao(
      valorRestante,
      cota.id,
      input.dadosCartao,
    );

    const pagamento =
      pagamentoExistente ??
      new Pagamento(
        randomUUID(),
        cota.id,
        input.compradorId,
        sorteio.valorCota,
        0,
        'CARTAO_CREDITO',
        'PENDENTE',
        null,
        agora,
      );

    pagamento.atualizarCobranca('CARTAO_CREDITO', cobranca.transacaoId);

    if (cobranca.aprovado) {
      pagamento.aprovar();
      cota.confirmarPagamento();
      await this.cotaRepository.salvar(cota);
    } else {
      pagamento.recusar();
    }

    if (pagamentoExistente) {
      await this.pagamentoRepository.salvar(pagamento);
    } else {
      await this.pagamentoRepository.criar(pagamento);
    }

    return { status: cobranca.aprovado ? 'APROVADO' : 'RECUSADO' };
  }
}

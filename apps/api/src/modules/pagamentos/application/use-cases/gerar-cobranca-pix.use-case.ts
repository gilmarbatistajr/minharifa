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
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';

export interface GerarCobrancaPixInput {
  sorteioId: string;
  numeroCota: number;
  compradorId: string;
}

export interface GerarCobrancaPixOutput {
  qrCode: string;
  codigoCopiaCola: string;
  valor: number;
  validoAte: Date | null;
}

/**
 * Cobre pagamento-de-cota.feature: "Geração de cobrança via Pix" e "Falha
 * na comunicação com o gateway de pagamento" (a reserva não é tocada se a
 * geração da cobrança falhar).
 */
@Injectable()
export class GerarCobrancaPixUseCase {
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

  async executar(input: GerarCobrancaPixInput, agora: Date = new Date()): Promise<GerarCobrancaPixOutput> {
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

    const cobranca = await this.paymentGateway.gerarCobrancaPix(valorRestante, cota.id);

    if (pagamentoExistente) {
      pagamentoExistente.atualizarCobranca('PIX', cobranca.transacaoId);
      await this.pagamentoRepository.salvar(pagamentoExistente);
    } else {
      const pagamento = new Pagamento(
        randomUUID(),
        cota.id,
        input.compradorId,
        sorteio.valorCota,
        0,
        'PIX',
        'PENDENTE',
        cobranca.transacaoId,
        agora,
      );
      await this.pagamentoRepository.criar(pagamento);
    }

    return {
      qrCode: cobranca.qrCode,
      codigoCopiaCola: cobranca.codigoCopiaCola,
      valor: valorRestante,
      validoAte: cota.reservaExpiraEm,
    };
  }
}

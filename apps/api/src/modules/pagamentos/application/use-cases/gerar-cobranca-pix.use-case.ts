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
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import { resolverCotasElegiveisParaPagamento } from '../services/resolver-cotas-elegiveis-pagamento';

export interface GerarCobrancaPixInput {
  campanhaId: string;
  numerosCotas: number[];
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
 * geração da cobrança falhar). Gera uma única cobrança cobrindo TODAS as
 * cotas reservadas do comprador na campanha — ver
 * `resolverCotasElegiveisParaPagamento`: não é permitido pagar só parte
 * delas.
 */
@Injectable()
export class GerarCobrancaPixUseCase {
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

  async executar(input: GerarCobrancaPixInput, agora: Date = new Date()): Promise<GerarCobrancaPixOutput> {
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
    const cobranca = await this.paymentGateway.gerarCobrancaPix(valorTotalRestante, referencia);

    for (const item of itens) {
      if (item.pagamentoExistente) {
        item.pagamentoExistente.atualizarCobranca('PIX', cobranca.transacaoId);
        await this.pagamentoRepository.salvar(item.pagamentoExistente);
      } else {
        const pagamento = new Pagamento(
          randomUUID(),
          item.cota.id,
          input.compradorId,
          campanha.valorCota,
          0,
          'PIX',
          'PENDENTE',
          cobranca.transacaoId,
          agora,
        );
        await this.pagamentoRepository.criar(pagamento);
      }
    }

    const expiracoes = cotas
      .map((cota) => cota.reservaExpiraEm)
      .filter((data): data is Date => data !== null);
    const validoAte =
      expiracoes.length > 0 ? new Date(Math.min(...expiracoes.map((data) => data.getTime()))) : null;

    return {
      qrCode: cobranca.qrCode,
      codigoCopiaCola: cobranca.codigoCopiaCola,
      valor: valorTotalRestante,
      validoAte,
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import { atualizarStatusCampanhaAposPagamento } from '../../../campanhas/application/services/atualizar-status-apos-pagamento';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import {
  WEBHOOK_SIGNATURE_VALIDATOR,
  WebhookSignatureValidator,
} from '../../domain/services/webhook-signature-validator';
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from '../../../../shared/domain/notification-sender';

export interface ConfirmarPagamentoWebhookInput {
  payloadBruto: string;
  assinatura: string;
  transacaoId: string;
  statusGateway: 'APROVADO' | 'RECUSADO';
}

/**
 * Cobre pagamento-de-cota.feature: "Confirmação de pagamento via Pix dentro
 * do prazo", "Pagamento confirmado depois que a reserva já expirou (webhook
 * tardio)" e "Validação de assinatura do webhook de pagamento". Uma
 * transação do gateway pode cobrir várias cotas pagas juntas (ver
 * `resolverCotasElegiveisParaPagamento`) — todas são confirmadas ou
 * estornadas em conjunto, nunca parcialmente.
 */
@Injectable()
export class ConfirmarPagamentoWebhookUseCase {
  constructor(
    @Inject(WEBHOOK_SIGNATURE_VALIDATOR)
    private readonly webhookSignatureValidator: WebhookSignatureValidator,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(input: ConfirmarPagamentoWebhookInput): Promise<void> {
    const assinaturaValida = this.webhookSignatureValidator.validar(
      input.payloadBruto,
      input.assinatura,
    );

    if (!assinaturaValida) {
      throw new Error('Assinatura do webhook inválida.');
    }

    const pagamentos = await this.pagamentoRepository.listarPorTransacaoGateway(input.transacaoId);
    if (pagamentos.length === 0) {
      throw new Error('Pagamento não encontrado para esta transação.');
    }

    const pendentes = pagamentos.filter((pagamento) => pagamento.status === 'PENDENTE');
    if (pendentes.length === 0) {
      return;
    }

    if (input.statusGateway === 'RECUSADO') {
      for (const pagamento of pendentes) {
        pagamento.recusar();
        await this.pagamentoRepository.salvar(pagamento);
      }
      return;
    }

    const cotasPorPagamento = await Promise.all(
      pendentes.map(async (pagamento) => ({
        pagamento,
        cota: await this.cotaRepository.buscarPorId(pagamento.cotaId),
      })),
    );

    const todasReservasAindaValidas = cotasPorPagamento.every(
      ({ pagamento, cota }) =>
        !!cota && cota.status === 'RESERVADA' && cota.compradorId === pagamento.compradorId,
    );

    if (todasReservasAindaValidas) {
      for (const { pagamento, cota } of cotasPorPagamento) {
        cota!.confirmarPagamento();
        await this.cotaRepository.salvar(cota!);

        pagamento.aprovar();
        await this.pagamentoRepository.salvar(pagamento);
      }

      const campanha = await this.campanhaRepository.buscarPorId(cotasPorPagamento[0].cota!.campanhaId);
      if (campanha) {
        await atualizarStatusCampanhaAposPagamento(this.campanhaRepository, this.cotaRepository, campanha);
      }
      return;
    }

    for (const pagamento of pendentes) {
      pagamento.estornar();
      await this.pagamentoRepository.salvar(pagamento);
    }
    await this.paymentGateway.estornar(input.transacaoId);

    const comprador = await this.compradorRepository.buscarPorId(pendentes[0].compradorId);
    if (comprador?.email) {
      await this.notificationSender.enviarEmail(
        comprador.email,
        'Pagamento estornado',
        'Sua reserva expirou antes da confirmação do pagamento, então o valor foi estornado automaticamente.',
      );
    }
  }
}

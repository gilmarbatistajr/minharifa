import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../sorteios/domain/repositories/cota.repository';
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
 * tardio)" e "Validação de assinatura do webhook de pagamento".
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

    const pagamento = await this.pagamentoRepository.buscarPorTransacaoGateway(input.transacaoId);
    if (!pagamento) {
      throw new Error('Pagamento não encontrado para esta transação.');
    }

    if (pagamento.status !== 'PENDENTE') {
      return;
    }

    if (input.statusGateway === 'RECUSADO') {
      pagamento.recusar();
      await this.pagamentoRepository.salvar(pagamento);
      return;
    }

    const cota = await this.cotaRepository.buscarPorId(pagamento.cotaId);
    const reservaAindaValidaParaEstePagamento =
      !!cota && cota.status === 'RESERVADA' && cota.compradorId === pagamento.compradorId;

    if (reservaAindaValidaParaEstePagamento && cota) {
      cota.confirmarPagamento();
      await this.cotaRepository.salvar(cota);

      pagamento.aprovar();
      await this.pagamentoRepository.salvar(pagamento);
      return;
    }

    pagamento.estornar();
    await this.pagamentoRepository.salvar(pagamento);
    await this.paymentGateway.estornar(input.transacaoId);

    const comprador = await this.compradorRepository.buscarPorId(pagamento.compradorId);
    if (comprador?.email) {
      await this.notificationSender.enviarEmail(
        comprador.email,
        'Pagamento estornado',
        'Sua reserva expirou antes da confirmação do pagamento, então o valor foi estornado automaticamente.',
      );
    }
  }
}

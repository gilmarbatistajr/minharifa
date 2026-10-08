import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookSignatureValidator } from '../domain/services/webhook-signature-validator';

@Injectable()
export class HmacWebhookSignatureValidator implements WebhookSignatureValidator {
  constructor(private readonly configService: ConfigService) {}

  validar(payloadBruto: string, assinatura: string): boolean {
    const secret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');

    if (!secret) {
      return false;
    }

    const assinaturaEsperada = createHmac('sha256', secret).update(payloadBruto).digest('hex');
    const bufferEsperado = Buffer.from(assinaturaEsperada);
    const bufferRecebido = Buffer.from(assinatura);

    if (bufferEsperado.length !== bufferRecebido.length) {
      return false;
    }

    return timingSafeEqual(bufferEsperado, bufferRecebido);
  }
}

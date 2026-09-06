/**
 * Porta do domínio para validação da assinatura de webhooks do gateway de
 * pagamento. Implementação concreta (HMAC) fica na camada de infrastructure.
 */
export interface WebhookSignatureValidator {
  validar(payloadBruto: string, assinatura: string): boolean;
}

export const WEBHOOK_SIGNATURE_VALIDATOR = Symbol('WEBHOOK_SIGNATURE_VALIDATOR');

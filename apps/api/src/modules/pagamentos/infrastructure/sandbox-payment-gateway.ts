import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CobrancaCartao,
  CobrancaPix,
  DadosCartao,
  PaymentGateway,
} from '../domain/services/payment-gateway';

/**
 * Implementação de sandbox do gateway de pagamento (Mercado Pago em
 * produção). Gera QR codes e transações fictícias e aprova qualquer
 * cartão que não termine em "0000" (recusa), útil para exercitar os dois
 * caminhos em ambiente de desenvolvimento. Trocar por um adapter real sem
 * alterar nenhum caso de uso, pois eles dependem só da porta `PaymentGateway`.
 */
@Injectable()
export class SandboxPaymentGateway implements PaymentGateway {
  async gerarCobrancaPix(valor: number, referencia: string): Promise<CobrancaPix> {
    const transacaoId = randomUUID();
    return {
      transacaoId,
      qrCode: `sandbox-qr:${referencia}:${valor}:${transacaoId}`,
      codigoCopiaCola: `sandbox-copia-e-cola:${transacaoId}`,
    };
  }

  async gerarCobrancaCartao(
    _valor: number,
    _referencia: string,
    dadosCartao: DadosCartao,
  ): Promise<CobrancaCartao> {
    return {
      transacaoId: randomUUID(),
      aprovado: !dadosCartao.numero.endsWith('0000'),
    };
  }

  async estornar(_transacaoId: string): Promise<void> {
    // Sandbox: nada a fazer, apenas simula sucesso do estorno junto ao gateway.
  }
}

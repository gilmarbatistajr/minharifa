export interface DadosCartao {
  numero: string;
  validade: string;
  cvv: string;
  nomeTitular: string;
}

export interface CobrancaPix {
  transacaoId: string;
  qrCode: string;
  codigoCopiaCola: string;
}

export interface CobrancaCartao {
  transacaoId: string;
  aprovado: boolean;
}

/**
 * Porta do domínio para o gateway de pagamento (Mercado Pago em sandbox).
 * A implementação concreta fica na camada de infrastructure.
 */
export interface PaymentGateway {
  gerarCobrancaPix(valor: number, referencia: string): Promise<CobrancaPix>;
  gerarCobrancaCartao(
    valor: number,
    referencia: string,
    dadosCartao: DadosCartao,
  ): Promise<CobrancaCartao>;
  estornar(transacaoId: string): Promise<void>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

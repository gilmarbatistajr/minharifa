export interface DadosCartao {
  numero: string;
  validade: string;
  cvv: string;
  nomeTitular: string;
}

export interface CobrancaCartao {
  transacaoId: string;
  aprovado: boolean;
}

/**
 * Porta do domínio para o gateway de pagamento por cartão (Mercado Pago em
 * sandbox). O Pix não passa por aqui: é gerado localmente, sem gateway, direto
 * para a chave Pix da campanha (ver `gerarPixCopiaECola`).
 */
export interface PaymentGateway {
  gerarCobrancaCartao(
    valor: number,
    referencia: string,
    dadosCartao: DadosCartao,
  ): Promise<CobrancaCartao>;
  estornar(transacaoId: string): Promise<void>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

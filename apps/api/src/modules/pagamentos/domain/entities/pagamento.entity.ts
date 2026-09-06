export type MetodoPagamento = 'PIX' | 'CARTAO_CREDITO' | 'CASHBACK';
export type StatusPagamento = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'ESTORNADO';

export class Pagamento {
  constructor(
    public readonly id: string,
    public readonly cotaId: string,
    public readonly compradorId: string,
    public readonly valor: number,
    public valorCashbackAplicado: number,
    public metodo: MetodoPagamento,
    public status: StatusPagamento,
    public idTransacaoGateway: string | null,
    public readonly criadoEm: Date,
  ) {}

  calcularValorRestante(): number {
    return this.valor - this.valorCashbackAplicado;
  }

  /**
   * Inicia uma nova tentativa de cobrança para este pagamento. Permitido a
   * partir de PENDENTE ou RECUSADO (nova tentativa após recusa, cobre
   * "ela pode tentar novamente com outro método antes da reserva expirar").
   */
  atualizarCobranca(metodo: MetodoPagamento, idTransacaoGateway: string): void {
    if (this.status === 'APROVADO' || this.status === 'ESTORNADO') {
      throw new Error('Este pagamento já foi processado.');
    }

    this.metodo = metodo;
    this.idTransacaoGateway = idTransacaoGateway;
    this.status = 'PENDENTE';
  }

  aprovar(): void {
    if (this.status === 'APROVADO' || this.status === 'ESTORNADO') {
      throw new Error('Apenas pagamentos pendentes podem ser aprovados.');
    }

    this.status = 'APROVADO';
  }

  recusar(): void {
    if (this.status !== 'PENDENTE') {
      throw new Error('Apenas pagamentos pendentes podem ser recusados.');
    }

    this.status = 'RECUSADO';
  }

  /** Cobre o cenário de webhook tardio: o valor já capturado precisa ser estornado. */
  estornar(): void {
    if (this.status === 'ESTORNADO' || this.status === 'RECUSADO') {
      throw new Error('Este pagamento não pode ser estornado.');
    }

    this.status = 'ESTORNADO';
  }
}

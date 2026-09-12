export type StatusEscolhaPosCancelamento =
  | 'PENDENTE'
  | 'REEMBOLSO'
  | 'CREDITO_PROXIMO_SORTEIO'
  | 'CASHBACK';

export class EscolhaPosCancelamento {
  constructor(
    public readonly id: string,
    public readonly sorteioId: string,
    public readonly compradorId: string,
    public readonly quantidadeCotas: number,
    public readonly valorTotal: number,
    public status: StatusEscolhaPosCancelamento,
    public readonly prazoExpiraEm: Date,
    public decididoEm: Date | null,
    public readonly criadoEm: Date,
  ) {}

  private garantirPendente(): void {
    if (this.status !== 'PENDENTE') {
      throw new Error('Esta escolha já foi decidida.');
    }
  }

  private garantirDentroDoPrazo(agora: Date): void {
    if (agora > this.prazoExpiraEm) {
      throw new Error('O prazo para decidir sobre o cancelamento já expirou.');
    }
  }

  /** Cobre "Comprador escolhe reembolso do valor investido". */
  escolherReembolso(agora: Date): void {
    this.garantirPendente();
    this.garantirDentroDoPrazo(agora);

    this.status = 'REEMBOLSO';
    this.decididoEm = agora;
  }

  /** Cobre "Comprador escolhe manter a quantidade de cotas para o próximo sorteio". */
  escolherManterCotas(agora: Date): void {
    this.garantirPendente();
    this.garantirDentroDoPrazo(agora);

    this.status = 'CREDITO_PROXIMO_SORTEIO';
    this.decididoEm = agora;
  }

  /** Cobre "Comprador não se manifesta dentro do prazo definido". */
  expirarParaCashback(agora: Date): void {
    this.garantirPendente();

    if (agora <= this.prazoExpiraEm) {
      throw new Error('O prazo para decidir sobre o cancelamento ainda não expirou.');
    }

    this.status = 'CASHBACK';
    this.decididoEm = agora;
  }
}

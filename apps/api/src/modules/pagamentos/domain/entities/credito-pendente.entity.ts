export class CreditoPendente {
  constructor(
    public readonly id: string,
    public readonly compradorId: string,
    public readonly grupoId: string,
    public readonly sorteioOrigemId: string,
    public readonly quantidadeCotas: number,
    public readonly valorTotal: number,
    public utilizado: boolean,
    public readonly criadoEm: Date,
  ) {}

  /** Cobre o resgate do crédito ao escolher os números no próximo sorteio. */
  marcarComoUtilizado(): void {
    if (this.utilizado) {
      throw new Error('Este crédito já foi utilizado.');
    }

    this.utilizado = true;
  }
}

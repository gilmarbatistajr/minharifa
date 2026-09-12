export type StatusCota = 'DISPONIVEL' | 'RESERVADA' | 'PAGA' | 'CANCELADA_REEMBOLSADA';

export class Cota {
  constructor(
    public readonly id: string,
    public readonly sorteioId: string,
    public readonly numero: number,
    public status: StatusCota,
    public compradorId: string | null,
    public reservadaEm: Date | null,
    public reservaExpiraEm: Date | null,
  ) {}

  /** Regra de negócio: uma cota só pode ser reservada se estiver disponível,
   *  ou se a reserva anterior já tiver expirado. */
  podeSerReservadaPor(agora: Date): boolean {
    if (this.status === 'DISPONIVEL') {
      return true;
    }

    if (this.status === 'RESERVADA' && this.reservaExpiraEm) {
      return agora > this.reservaExpiraEm;
    }

    return false;
  }

  reservarPara(compradorId: string, agora: Date, minutosExpiracao: number): void {
    if (!this.podeSerReservadaPor(agora)) {
      throw new Error(`Cota ${this.numero} não está disponível para reserva.`);
    }

    this.status = 'RESERVADA';
    this.compradorId = compradorId;
    this.reservadaEm = agora;
    this.reservaExpiraEm = new Date(agora.getTime() + minutosExpiracao * 60_000);
  }

  confirmarPagamento(): void {
    if (this.status !== 'RESERVADA') {
      throw new Error(`Cota ${this.numero} não está reservada, não é possível confirmar pagamento.`);
    }

    this.status = 'PAGA';
  }

  /**
   * Paga a cota diretamente, sem passar pelo estado reservado — usado para
   * resgate de crédito de sorteio cancelado (cancelamento-de-sorteio.feature).
   */
  pagarComCredito(compradorId: string, agora: Date): void {
    if (this.status !== 'DISPONIVEL') {
      throw new Error(`Cota ${this.numero} não está disponível.`);
    }

    this.status = 'PAGA';
    this.compradorId = compradorId;
    this.reservadaEm = agora;
    this.reservaExpiraEm = null;
  }

  /** Cobre cancelamento-de-sorteio.feature: comprador escolhe reembolso. */
  cancelarEReembolsar(): void {
    if (this.status !== 'PAGA') {
      throw new Error(`Cota ${this.numero} não está paga, não é possível reembolsar.`);
    }

    this.status = 'CANCELADA_REEMBOLSADA';
  }

  liberar(): void {
    this.status = 'DISPONIVEL';
    this.compradorId = null;
    this.reservadaEm = null;
    this.reservaExpiraEm = null;
  }
}

export type StatusCota = 'DISPONIVEL' | 'RESERVADA' | 'PAGA' | 'CANCELADA_REEMBOLSADA';

export interface DadosContatoConvidado {
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
}

export class Cota {
  constructor(
    public readonly id: string,
    public readonly campanhaId: string,
    public readonly numero: number,
    public status: StatusCota,
    public compradorId: string | null,
    public reservadaEm: Date | null,
    public reservaExpiraEm: Date | null,
    public tokenReservaConvidado: string | null = null,
    public convidadoNome: string | null = null,
    public convidadoEmail: string | null = null,
    public convidadoTelefone: string | null = null,
    public convidadoCpf: string | null = null,
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

  /** `minutosExpiracao` nulo replica a campanha configurada "sem expiração automática": a cota fica reservada até ser paga ou liberada manualmente. */
  reservarPara(compradorId: string, agora: Date, minutosExpiracao: number | null): void {
    if (!this.podeSerReservadaPor(agora)) {
      throw new Error(`Cota ${this.numero} não está disponível para reserva.`);
    }

    this.status = 'RESERVADA';
    this.compradorId = compradorId;
    this.tokenReservaConvidado = null;
    this.convidadoNome = null;
    this.convidadoEmail = null;
    this.convidadoTelefone = null;
    this.convidadoCpf = null;
    this.reservadaEm = agora;
    this.reservaExpiraEm = minutosExpiracao === null ? null : new Date(agora.getTime() + minutosExpiracao * 60_000);
  }

  /** Mesma regra de `reservarPara`, mas para quem reserva sem conta: guarda o
   *  contato informado na própria cota em vez de um `compradorId`. */
  reservarParaConvidado(
    token: string,
    dadosContato: DadosContatoConvidado,
    agora: Date,
    minutosExpiracao: number | null,
  ): void {
    if (!this.podeSerReservadaPor(agora)) {
      throw new Error(`Cota ${this.numero} não está disponível para reserva.`);
    }

    this.status = 'RESERVADA';
    this.compradorId = null;
    this.tokenReservaConvidado = token;
    this.convidadoNome = dadosContato.nome;
    this.convidadoEmail = dadosContato.email;
    this.convidadoTelefone = dadosContato.telefone;
    this.convidadoCpf = dadosContato.cpf;
    this.reservadaEm = agora;
    this.reservaExpiraEm = minutosExpiracao === null ? null : new Date(agora.getTime() + minutosExpiracao * 60_000);
  }

  confirmarPagamento(): void {
    if (this.status !== 'RESERVADA') {
      throw new Error(`Cota ${this.numero} não está reservada, não é possível confirmar pagamento.`);
    }

    this.status = 'PAGA';
  }

  /**
   * Paga a cota diretamente, sem passar pelo estado reservado — usado para
   * resgate de crédito de campanha cancelada (cancelamento-de-sorteio.feature).
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
    this.tokenReservaConvidado = null;
    this.convidadoNome = null;
    this.convidadoEmail = null;
    this.convidadoTelefone = null;
    this.convidadoCpf = null;
  }
}

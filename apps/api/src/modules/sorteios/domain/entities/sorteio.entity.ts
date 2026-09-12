export type StatusSorteio =
  | 'AGUARDANDO_ABERTURA'
  | 'VENDAS_ABERTAS'
  | 'VENDAS_ENCERRADAS'
  | 'COTAS_ESGOTADAS'
  | 'FINALIZADO'
  | 'CANCELADO';

const HORAS_ALERTA_ENCERRAMENTO = 24;

export class Sorteio {
  constructor(
    public readonly id: string,
    public readonly grupoId: string,
    public readonly premioId: string,
    public readonly dataAberturaVendas: Date,
    public readonly dataEncerramentoVendas: Date,
    public readonly dataRealizacao: Date,
    public readonly quantidadeCotas: number,
    public valorCota: number,
    public status: StatusSorteio,
    public cotaVencedoraNumero: number | null,
    public vencedorOptouPorDinheiro: boolean | null,
  ) {}

  /** Regra de negócio: só é possível cancelar sorteios que ainda não terminaram. */
  cancelar(): void {
    if (this.status === 'FINALIZADO' || this.status === 'CANCELADO') {
      throw new Error(`Sorteio já está ${this.status.toLowerCase()}, não pode ser cancelado.`);
    }

    this.status = 'CANCELADO';
  }

  /** Cobre o atalho "sorteio encerrando em 24h" do dashboard-visao-geral.feature. */
  estaEncerrandoEm24h(agora: Date): boolean {
    if (this.status !== 'VENDAS_ABERTAS') {
      return false;
    }

    const horasRestantes = (this.dataEncerramentoVendas.getTime() - agora.getTime()) / 3_600_000;
    return horasRestantes >= 0 && horasRestantes <= HORAS_ALERTA_ENCERRAMENTO;
  }

  /** Cobre o atalho "cotas esgotadas aguardando resultado" do dashboard-visao-geral.feature. */
  estaAguardandoResultado(): boolean {
    return this.status === 'COTAS_ESGOTADAS';
  }

  calcularPercentualVendido(cotasPagas: number): number {
    if (this.quantidadeCotas === 0) {
      return 0;
    }

    return Math.round((cotasPagas / this.quantidadeCotas) * 100);
  }
}

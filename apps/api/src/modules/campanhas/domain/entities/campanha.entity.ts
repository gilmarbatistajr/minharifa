export type StatusVendasCampanha =
  | 'AGUARDANDO_ABERTURA'
  | 'VENDAS_ABERTAS'
  | 'VENDAS_ENCERRADAS'
  | 'COTAS_ESGOTADAS'
  | 'FINALIZADO'
  | 'CANCELADO';

/**
 * Ciclo de vida da campanha, independente do status de vendas:
 * NOVO: acabou de ser criada, ainda sem grupo.
 * AGUARDANDO_LIBERACAO: administrador já revisou o conteúdo.
 * LIBERADA: lançada para um grupo, com vendas em andamento.
 * FINALIZADA: vencedor já registrado.
 */
export type StatusCampanha = 'NOVO' | 'AGUARDANDO_LIBERACAO' | 'LIBERADA' | 'FINALIZADA';

/**
 * ESCOLHA_NUMERO: o comprador escolhe manualmente os números que deseja.
 * LOTE_FECHADO: o comprador escolhe apenas uma quantidade e o sistema
 * sorteia os números dentro dos disponíveis.
 */
export type FormaVendaCotas = 'ESCOLHA_NUMERO' | 'LOTE_FECHADO';

/** Opções fixas exibidas no formulário de criação da campanha; `null` = sem expiração automática. */
export const EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS = [5, 10, 30, 60, 120] as const;

const HORAS_ALERTA_ENCERRAMENTO = 24;

export class Campanha {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public grupoId: string | null,
    public readonly nome: string,
    public readonly descricao: string,
    public readonly premioIds: string[],
    public dataAberturaVendas: Date | null,
    public dataEncerramentoVendas: Date | null,
    public dataRealizacao: Date | null,
    public readonly quantidadeCotas: number,
    public valorCota: number,
    public readonly formaVenda: FormaVendaCotas,
    public status: StatusCampanha,
    public statusVendas: StatusVendasCampanha,
    public cotaVencedoraNumero: number | null,
    public vencedorOptouPorDinheiro: boolean | null,
    public removidaEm: Date | null = null,
    public readonly telefoneSuporte: string = '',
    public readonly quantidadeMinimaPorCompra: number = 1,
    public readonly quantidadeMaximaPorCompra: number | null = null,
    public readonly expiracaoReservaMinutos: number | null = 2,
    public readonly reservaExigeEmail: boolean = true,
    public readonly reservaExigeNome: boolean = true,
    public readonly reservaExigeTelefone: boolean = true,
    public readonly reservaExigeConfirmacaoTelefone: boolean = false,
  ) {}

  estaRemovida(): boolean {
    return this.removidaEm !== null;
  }

  /** Remoção lógica: a campanha some das ações do dia a dia mas continua visível na listagem. */
  remover(agora: Date): void {
    if (this.estaRemovida()) {
      throw new Error('Campanha já está removida.');
    }

    if (this.status === 'LIBERADA') {
      throw new Error('Uma campanha liberada não pode ser removida.');
    }

    this.removidaEm = agora;
  }

  restaurar(): void {
    if (!this.estaRemovida()) {
      throw new Error('Campanha não está removida.');
    }

    this.removidaEm = null;
  }

  /** Regra de negócio: só campanhas ESCOLHA_NUMERO aceitam seleção manual de números. */
  permiteEscolhaManual(): boolean {
    return this.formaVenda === 'ESCOLHA_NUMERO';
  }

  /** Regra de negócio: só campanhas LOTE_FECHADO aceitam compra por quantidade sorteada. */
  permiteLoteFechado(): boolean {
    return this.formaVenda === 'LOTE_FECHADO';
  }

  /** Regra de negócio: só uma campanha nova pode ser marcada como revisada. */
  marcarComoRevisada(): void {
    if (this.status !== 'NOVO') {
      throw new Error('Somente campanhas novas podem ser marcadas como revisadas.');
    }

    this.status = 'AGUARDANDO_LIBERACAO';
  }

  /**
   * Regra de negócio: só uma campanha aguardando liberação pode ser
   * lançada — o lançamento é o que vincula a campanha a um grupo e define
   * as datas de venda.
   */
  lancar(
    grupoId: string,
    dataAberturaVendas: Date,
    dataEncerramentoVendas: Date | null,
    dataRealizacao: Date | null,
  ): void {
    if (this.status !== 'AGUARDANDO_LIBERACAO') {
      throw new Error('Somente campanhas aguardando liberação podem ser lançadas.');
    }

    if (dataEncerramentoVendas && dataEncerramentoVendas <= dataAberturaVendas) {
      throw new Error('A data de encerramento das vendas deve ser depois da abertura.');
    }

    if (dataRealizacao && dataEncerramentoVendas && dataRealizacao < dataEncerramentoVendas) {
      throw new Error('A data de realização deve ser igual ou depois do encerramento das vendas.');
    }

    this.grupoId = grupoId;
    this.dataAberturaVendas = dataAberturaVendas;
    this.dataEncerramentoVendas = dataEncerramentoVendas;
    this.dataRealizacao = dataRealizacao;
    this.status = 'LIBERADA';
  }

  /** Regra de negócio: só é possível cancelar campanhas que ainda não terminaram. */
  cancelar(): void {
    if (this.statusVendas === 'FINALIZADO' || this.statusVendas === 'CANCELADO') {
      throw new Error(`Campanha já está ${this.statusVendas.toLowerCase()}, não pode ser cancelada.`);
    }

    this.statusVendas = 'CANCELADO';
  }

  /**
   * Regra de negócio: só uma campanha liberada (e ainda não finalizada ou
   * cancelada) pode ser finalizada, e só depois da data de realização.
   */
  finalizar(cotaVencedoraNumero: number, agora: Date): void {
    if (this.status !== 'LIBERADA') {
      throw new Error('Somente campanhas liberadas podem ser finalizadas.');
    }

    if (this.statusVendas === 'FINALIZADO' || this.statusVendas === 'CANCELADO') {
      throw new Error(`Campanha já está ${this.statusVendas.toLowerCase()}, não pode ser finalizada.`);
    }

    if (!this.dataRealizacao || agora < this.dataRealizacao) {
      throw new Error('A campanha só pode ser finalizada após a data de realização.');
    }

    if (cotaVencedoraNumero < 1 || cotaVencedoraNumero > this.quantidadeCotas) {
      throw new Error('O número da cota vencedora é inválido para esta campanha.');
    }

    this.statusVendas = 'FINALIZADO';
    this.status = 'FINALIZADA';
    this.cotaVencedoraNumero = cotaVencedoraNumero;
  }

  /** Cobre o atalho "campanha encerrando em 24h" do dashboard-visao-geral.feature. */
  estaEncerrandoEm24h(agora: Date): boolean {
    if (this.statusVendas !== 'VENDAS_ABERTAS' || !this.dataEncerramentoVendas) {
      return false;
    }

    const horasRestantes = (this.dataEncerramentoVendas.getTime() - agora.getTime()) / 3_600_000;
    return horasRestantes >= 0 && horasRestantes <= HORAS_ALERTA_ENCERRAMENTO;
  }

  /** Cobre o atalho "cotas esgotadas aguardando resultado" do dashboard-visao-geral.feature. */
  estaAguardandoResultado(): boolean {
    return this.statusVendas === 'COTAS_ESGOTADAS';
  }

  calcularPercentualVendido(cotasPagas: number): number {
    if (this.quantidadeCotas === 0) {
      return 0;
    }

    return Math.round((cotasPagas / this.quantidadeCotas) * 100);
  }
}

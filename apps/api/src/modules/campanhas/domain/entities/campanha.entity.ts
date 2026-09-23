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
 * LIBERADA_PARA_SORTEIO: todas as cotas foram pagas — pronta para registrar o vencedor.
 * FINALIZADA: vencedor já registrado.
 */
export type StatusCampanha =
  | 'NOVO'
  | 'AGUARDANDO_LIBERACAO'
  | 'LIBERADA'
  | 'LIBERADA_PARA_SORTEIO'
  | 'FINALIZADA';

/**
 * ESCOLHA_NUMERO: o comprador escolhe manualmente os números que deseja.
 * LOTE_FECHADO: o comprador escolhe apenas uma quantidade e o sistema
 * sorteia os números dentro dos disponíveis.
 */
export type FormaVendaCotas = 'ESCOLHA_NUMERO' | 'LOTE_FECHADO';

/** Opções fixas exibidas no formulário de criação da campanha; `null` = sem expiração automática. */
export const EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS = [5, 10, 30, 60, 120] as const;

const HORAS_ALERTA_ENCERRAMENTO = 24;

export interface DadosAtualizacaoCampanha {
  nome: string;
  descricao: string;
  telefoneSuporte: string;
  premioIds: string[];
  quantidadeCotas: number;
  valorCota: number;
  formaVenda: FormaVendaCotas;
  quantidadeMinimaPorCompra: number;
  quantidadeMaximaPorCompra: number | null;
  expiracaoReservaMinutos: number | null;
  reservaExigeEmail: boolean;
  reservaExigeNome: boolean;
  reservaExigeTelefone: boolean;
  reservaExigeConfirmacaoTelefone: boolean;
}

export interface DadosFinalizacaoCampanha {
  cotaVencedoraNumero: number;
  vencedorNome: string;
  vencedorTelefone: string;
}

export class Campanha {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public grupoId: string | null,
    public nome: string,
    public descricao: string,
    public premioIds: string[],
    public dataAberturaVendas: Date | null,
    public dataEncerramentoVendas: Date | null,
    public dataRealizacao: Date | null,
    public quantidadeCotas: number,
    public valorCota: number,
    public formaVenda: FormaVendaCotas,
    public status: StatusCampanha,
    public statusVendas: StatusVendasCampanha,
    public cotaVencedoraNumero: number | null,
    public vencedorOptouPorDinheiro: boolean | null,
    public removidaEm: Date | null = null,
    public telefoneSuporte: string = '',
    public quantidadeMinimaPorCompra: number = 1,
    public quantidadeMaximaPorCompra: number | null = null,
    public expiracaoReservaMinutos: number | null = 2,
    public reservaExigeEmail: boolean = true,
    public reservaExigeNome: boolean = true,
    public reservaExigeTelefone: boolean = true,
    public reservaExigeConfirmacaoTelefone: boolean = false,
    public fotoUrl: string | null = null,
    public vencedorNome: string | null = null,
    public vencedorTelefone: string | null = null,
  ) {}

  estaRemovida(): boolean {
    return this.removidaEm !== null;
  }

  /** Cobre upload-de-foto-de-campanha: substitui a foto após o upload ser validado e salvo. */
  definirFoto(url: string): void {
    this.fotoUrl = url;
  }

  /**
   * Remoção lógica: a campanha some das ações do dia a dia mas continua
   * visível na listagem. Só é permitida antes do lançamento — depois disso
   * (vendas em andamento, pronta para sorteio ou já finalizada) a campanha
   * não pode mais ser removida nem editada.
   */
  remover(agora: Date): void {
    if (this.estaRemovida()) {
      throw new Error('Campanha já está removida.');
    }

    if (this.status !== 'NOVO' && this.status !== 'AGUARDANDO_LIBERACAO') {
      throw new Error('Só é possível remover campanhas que ainda não foram lançadas para um grupo.');
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
   * Regra de negócio: só uma campanha nova (ainda não revisada) pode ter
   * todo o seu conteúdo editado — depois de revisada, o único caminho é o
   * lançamento (que fixa grupo e datas).
   */
  atualizar(dados: DadosAtualizacaoCampanha): void {
    if (this.estaRemovida()) {
      throw new Error('Não é possível editar uma campanha removida.');
    }

    if (this.status !== 'NOVO') {
      throw new Error('Somente campanhas novas podem ser editadas.');
    }

    this.nome = dados.nome;
    this.descricao = dados.descricao;
    this.telefoneSuporte = dados.telefoneSuporte;
    this.premioIds = dados.premioIds;
    this.quantidadeCotas = dados.quantidadeCotas;
    this.valorCota = dados.valorCota;
    this.formaVenda = dados.formaVenda;
    this.quantidadeMinimaPorCompra = dados.quantidadeMinimaPorCompra;
    this.quantidadeMaximaPorCompra = dados.quantidadeMaximaPorCompra;
    this.expiracaoReservaMinutos = dados.expiracaoReservaMinutos;
    this.reservaExigeEmail = dados.reservaExigeEmail;
    this.reservaExigeNome = dados.reservaExigeNome;
    this.reservaExigeTelefone = dados.reservaExigeTelefone;
    this.reservaExigeConfirmacaoTelefone = dados.reservaExigeConfirmacaoTelefone;
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

  /**
   * Regra de negócio: quando a última cota de uma campanha liberada é paga,
   * ela fica pronta para o sorteio — é o que libera os campos de vencedor
   * (nome, cota premiada, telefone) e o botão de finalizar na tela do
   * administrador. Quem decide "todas as cotas estão pagas" é a camada de
   * aplicação (ver `atualizarStatusCampanhaAposPagamento`), que só chama
   * este método depois de conferir isso.
   */
  liberarParaSorteio(): void {
    if (this.status !== 'LIBERADA') {
      throw new Error('Somente campanhas liberadas podem ficar prontas para o sorteio.');
    }

    this.status = 'LIBERADA_PARA_SORTEIO';
  }

  /** Regra de negócio: só é possível cancelar campanhas que ainda não terminaram. */
  cancelar(): void {
    if (this.statusVendas === 'FINALIZADO' || this.statusVendas === 'CANCELADO') {
      throw new Error(`Campanha já está ${this.statusVendas.toLowerCase()}, não pode ser cancelada.`);
    }

    this.statusVendas = 'CANCELADO';
  }

  /**
   * Regra de negócio: só uma campanha liberada para sorteio (todas as cotas
   * já pagas) pode ser finalizada. Exige nome e telefone do vencedor,
   * preenchidos manualmente pelo administrador/operador no momento do
   * sorteio — ficam gravados na campanha para alimentar o ranking "quem
   * mais ganhou" do dashboard.
   */
  finalizar(dados: DadosFinalizacaoCampanha): void {
    if (this.status !== 'LIBERADA_PARA_SORTEIO') {
      throw new Error('Somente campanhas liberadas para sorteio podem ser finalizadas.');
    }

    if (this.statusVendas === 'FINALIZADO' || this.statusVendas === 'CANCELADO') {
      throw new Error(`Campanha já está ${this.statusVendas.toLowerCase()}, não pode ser finalizada.`);
    }

    if (dados.cotaVencedoraNumero < 1 || dados.cotaVencedoraNumero > this.quantidadeCotas) {
      throw new Error('O número da cota vencedora é inválido para esta campanha.');
    }

    if (!dados.vencedorNome.trim()) {
      throw new Error('Informe o nome do vencedor.');
    }

    if (!dados.vencedorTelefone.trim()) {
      throw new Error('Informe o telefone do vencedor.');
    }

    this.statusVendas = 'FINALIZADO';
    this.status = 'FINALIZADA';
    this.cotaVencedoraNumero = dados.cotaVencedoraNumero;
    this.vencedorNome = dados.vencedorNome;
    this.vencedorTelefone = dados.vencedorTelefone;
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

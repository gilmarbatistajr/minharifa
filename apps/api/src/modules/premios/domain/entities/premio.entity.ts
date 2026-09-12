export interface DadosAtualizacaoPremio {
  nome?: string;
  descricao?: string;
  fotoUrl?: string;
  valor?: number;
  valorOpcaoDinheiro?: number | null;
}

export class Premio {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public nome: string,
    public descricao: string,
    public fotoUrl: string,
    public valor: number,
    public valorOpcaoDinheiro: number | null,
    public readonly criadoEm: Date,
  ) {}

  pertenceAoAdministrador(administradorId: string): boolean {
    return this.administradorId === administradorId;
  }

  /** Cobre cadastro-de-premio.feature: edição de nome/descrição/foto/valor. */
  atualizar(dados: DadosAtualizacaoPremio): void {
    if (dados.valor !== undefined && dados.valor <= 0) {
      throw new Error('O valor do prêmio deve ser maior que zero.');
    }

    if (dados.nome !== undefined) {
      this.nome = dados.nome;
    }
    if (dados.descricao !== undefined) {
      this.descricao = dados.descricao;
    }
    if (dados.fotoUrl !== undefined) {
      this.fotoUrl = dados.fotoUrl;
    }
    if (dados.valor !== undefined) {
      this.valor = dados.valor;
    }
    if (dados.valorOpcaoDinheiro !== undefined) {
      this.valorOpcaoDinheiro = dados.valorOpcaoDinheiro;
    }
  }
}

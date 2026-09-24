export interface DadosAtualizacaoPremio {
  nome?: string;
  descricao?: string;
  valor?: number;
  valorOpcaoDinheiro?: number | null;
}

export class Premio {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public nome: string,
    public descricao: string,
    public fotoUrl: string | null,
    public valor: number,
    public valorOpcaoDinheiro: number | null,
    public readonly criadoEm: Date,
  ) {}

  pertenceAoAdministrador(administradorId: string): boolean {
    return this.administradorId === administradorId;
  }

  /** Cobre upload-de-foto-de-premio.feature: substitui a foto após o upload ser validado e salvo. */
  definirFoto(url: string): void {
    this.fotoUrl = url;
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
    if (dados.valor !== undefined) {
      this.valor = dados.valor;
    }
    if (dados.valorOpcaoDinheiro !== undefined) {
      this.valorOpcaoDinheiro = dados.valorOpcaoDinheiro;
    }
  }
}

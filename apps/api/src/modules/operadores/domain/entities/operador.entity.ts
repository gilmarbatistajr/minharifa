export type RecursoMenuOperador = 'CAMPANHAS' | 'GRUPOS' | 'PREMIOS' | 'ALERTAS_AUTOMATICOS';

export interface PermissaoRecursoOperador {
  recurso: RecursoMenuOperador;
  podeCriar: boolean;
  podeEditar: boolean;
  podeRemover: boolean;
}

export interface DadosAtualizacaoOperador {
  nomeCompleto?: string;
  endereco?: string;
  rg?: string;
  telefone?: string;
  login?: string;
  grupoIds?: string[];
  permissoes?: PermissaoRecursoOperador[];
}

export class Operador {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public nomeCompleto: string,
    public endereco: string,
    public readonly cpf: string,
    public rg: string,
    public telefone: string,
    public login: string,
    public senhaHash: string,
    public grupoIds: string[],
    public readonly criadoEm: Date,
    public permissoes: PermissaoRecursoOperador[] = [],
  ) {}

  pertenceAoAdministrador(administradorId: string): boolean {
    return this.administradorId === administradorId;
  }

  /** Regra de negócio: só pode editar (ex.: finalizar uma campanha) quem tem permissão de edição no recurso. */
  podeEditarRecurso(recurso: RecursoMenuOperador): boolean {
    return this.permissoes.some((permissao) => permissao.recurso === recurso && permissao.podeEditar);
  }

  /** Cobre cadastro-de-operador.feature: edição de dados cadastrais e dos grupos associados. */
  atualizar(dados: DadosAtualizacaoOperador): void {
    if (dados.nomeCompleto !== undefined) {
      if (!dados.nomeCompleto.trim()) {
        throw new Error('Nome completo não pode ser vazio.');
      }
      this.nomeCompleto = dados.nomeCompleto;
    }
    if (dados.endereco !== undefined) {
      this.endereco = dados.endereco;
    }
    if (dados.rg !== undefined) {
      this.rg = dados.rg;
    }
    if (dados.telefone !== undefined) {
      this.telefone = dados.telefone;
    }
    if (dados.login !== undefined) {
      this.login = dados.login;
    }
    if (dados.grupoIds !== undefined) {
      this.grupoIds = dados.grupoIds;
    }
    if (dados.permissoes !== undefined) {
      this.permissoes = dados.permissoes;
    }
  }

  trocarSenha(novoHash: string): void {
    this.senhaHash = novoHash;
  }
}

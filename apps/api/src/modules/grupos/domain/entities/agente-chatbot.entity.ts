export interface AvisosAgenteChatbot {
  avisa50PorCentoVendido?: boolean;
  avisa80PorCentoVendido?: boolean;
  avisa90PorCentoVendido?: boolean;
  avisaNovaCampanha?: boolean;
  avisaResultado?: boolean;
  mensagem50PorCentoVendido?: string | null;
  mensagem80PorCentoVendido?: string | null;
  mensagem90PorCentoVendido?: string | null;
  mensagemNovaCampanha?: string | null;
  mensagemResultado?: string | null;
}

export class AgenteChatbot {
  constructor(
    public readonly id: string,
    public readonly grupoId: string,
    public ativo: boolean,
    public avisa50PorCentoVendido: boolean,
    public avisaNovaCampanha: boolean,
    public avisaResultado: boolean,
    public mensagem50PorCentoVendido: string | null = null,
    public mensagemNovaCampanha: string | null = null,
    public mensagemResultado: string | null = null,
    public avisa80PorCentoVendido: boolean = true,
    public avisa90PorCentoVendido: boolean = true,
    public mensagem80PorCentoVendido: string | null = null,
    public mensagem90PorCentoVendido: string | null = null,
  ) {}

  ativar(): void {
    this.ativo = true;
  }

  desativar(): void {
    this.ativo = false;
  }

  configurarAvisos(avisos: AvisosAgenteChatbot): void {
    if (avisos.avisa50PorCentoVendido !== undefined) {
      this.avisa50PorCentoVendido = avisos.avisa50PorCentoVendido;
    }
    if (avisos.avisa80PorCentoVendido !== undefined) {
      this.avisa80PorCentoVendido = avisos.avisa80PorCentoVendido;
    }
    if (avisos.avisa90PorCentoVendido !== undefined) {
      this.avisa90PorCentoVendido = avisos.avisa90PorCentoVendido;
    }
    if (avisos.avisaNovaCampanha !== undefined) {
      this.avisaNovaCampanha = avisos.avisaNovaCampanha;
    }
    if (avisos.avisaResultado !== undefined) {
      this.avisaResultado = avisos.avisaResultado;
    }
    if (avisos.mensagem50PorCentoVendido !== undefined) {
      this.mensagem50PorCentoVendido = avisos.mensagem50PorCentoVendido;
    }
    if (avisos.mensagem80PorCentoVendido !== undefined) {
      this.mensagem80PorCentoVendido = avisos.mensagem80PorCentoVendido;
    }
    if (avisos.mensagem90PorCentoVendido !== undefined) {
      this.mensagem90PorCentoVendido = avisos.mensagem90PorCentoVendido;
    }
    if (avisos.mensagemNovaCampanha !== undefined) {
      this.mensagemNovaCampanha = avisos.mensagemNovaCampanha;
    }
    if (avisos.mensagemResultado !== undefined) {
      this.mensagemResultado = avisos.mensagemResultado;
    }
  }
}

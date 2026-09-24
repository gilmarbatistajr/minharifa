export interface AvisosAgenteChatbot {
  avisaCotasRestantes?: boolean;
  avisaNovaCampanha?: boolean;
  avisaResultado?: boolean;
}

export class AgenteChatbot {
  constructor(
    public readonly id: string,
    public readonly grupoId: string,
    public ativo: boolean,
    public avisaCotasRestantes: boolean,
    public avisaNovaCampanha: boolean,
    public avisaResultado: boolean,
  ) {}

  ativar(): void {
    this.ativo = true;
  }

  desativar(): void {
    this.ativo = false;
  }

  configurarAvisos(avisos: AvisosAgenteChatbot): void {
    if (avisos.avisaCotasRestantes !== undefined) {
      this.avisaCotasRestantes = avisos.avisaCotasRestantes;
    }
    if (avisos.avisaNovaCampanha !== undefined) {
      this.avisaNovaCampanha = avisos.avisaNovaCampanha;
    }
    if (avisos.avisaResultado !== undefined) {
      this.avisaResultado = avisos.avisaResultado;
    }
  }
}

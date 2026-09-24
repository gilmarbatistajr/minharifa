export class Grupo {
  constructor(
    public readonly id: string,
    public readonly administradorId: string,
    public nome: string,
    public readonly identificadorWhatsapp: string,
    public readonly criadoEm: Date,
    public linkWhatsapp: string | null = null,
  ) {}

  pertenceAoAdministrador(administradorId: string): boolean {
    return this.administradorId === administradorId;
  }
}

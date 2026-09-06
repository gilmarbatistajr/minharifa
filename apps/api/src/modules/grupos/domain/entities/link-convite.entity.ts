export type StatusLinkConvite = 'ATIVO' | 'REVOGADO';

export class LinkConvite {
  constructor(
    public readonly id: string,
    public readonly grupoId: string,
    public readonly codigo: string,
    public status: StatusLinkConvite,
    public readonly criadoEm: Date,
  ) {}

  estaValido(): boolean {
    return this.status === 'ATIVO';
  }

  revogar(): void {
    if (this.status === 'REVOGADO') {
      throw new Error('Este link de convite já está revogado.');
    }

    this.status = 'REVOGADO';
  }
}

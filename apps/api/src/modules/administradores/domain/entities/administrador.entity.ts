export class Administrador {
  constructor(
    public readonly id: string,
    public nome: string,
    public email: string,
    public senhaHash: string,
    public emailConfirmado: boolean,
    public readonly criadoEm: Date,
    public tokenConfirmacaoEmail: string | null,
    public tokenConfirmacaoEmailExpiraEm: Date | null,
    public tokenRecuperacaoSenha: string | null,
    public tokenRecuperacaoSenhaExpiraEm: Date | null,
    public novoEmailPendente: string | null,
    public tokenConfirmacaoNovoEmail: string | null,
    public tokenConfirmacaoNovoEmailExpiraEm: Date | null,
  ) {}

  confirmarEmail(token: string, agora: Date): void {
    if (!this.tokenConfirmacaoEmail || this.tokenConfirmacaoEmail !== token) {
      throw new Error('Token de confirmação de e-mail inválido.');
    }

    if (!this.tokenConfirmacaoEmailExpiraEm || agora > this.tokenConfirmacaoEmailExpiraEm) {
      throw new Error('Token de confirmação de e-mail expirado.');
    }

    this.emailConfirmado = true;
    this.tokenConfirmacaoEmail = null;
    this.tokenConfirmacaoEmailExpiraEm = null;
  }

  solicitarRecuperacaoSenha(token: string, agora: Date, minutosValidade: number): void {
    this.tokenRecuperacaoSenha = token;
    this.tokenRecuperacaoSenhaExpiraEm = new Date(agora.getTime() + minutosValidade * 60_000);
  }

  redefinirSenha(token: string, novoHash: string, agora: Date): void {
    if (!this.tokenRecuperacaoSenha || this.tokenRecuperacaoSenha !== token) {
      throw new Error('Link de redefinição de senha inválido.');
    }

    if (!this.tokenRecuperacaoSenhaExpiraEm || agora > this.tokenRecuperacaoSenhaExpiraEm) {
      throw new Error('Link de redefinição de senha expirado.');
    }

    this.senhaHash = novoHash;
    this.tokenRecuperacaoSenha = null;
    this.tokenRecuperacaoSenhaExpiraEm = null;
  }

  trocarSenha(novoHash: string): void {
    this.senhaHash = novoHash;
  }

  atualizarNome(nome: string): void {
    if (!nome.trim()) {
      throw new Error('Nome não pode ser vazio.');
    }

    this.nome = nome;
  }

  solicitarTrocaEmail(novoEmail: string, token: string, agora: Date, horasValidade: number): void {
    this.novoEmailPendente = novoEmail;
    this.tokenConfirmacaoNovoEmail = token;
    this.tokenConfirmacaoNovoEmailExpiraEm = new Date(agora.getTime() + horasValidade * 3_600_000);
  }

  confirmarNovoEmail(token: string, agora: Date): void {
    if (!this.tokenConfirmacaoNovoEmail || this.tokenConfirmacaoNovoEmail !== token) {
      throw new Error('Token de confirmação de e-mail inválido.');
    }

    if (!this.tokenConfirmacaoNovoEmailExpiraEm || agora > this.tokenConfirmacaoNovoEmailExpiraEm) {
      throw new Error('Token de confirmação de e-mail expirado.');
    }

    if (!this.novoEmailPendente) {
      throw new Error('Não há troca de e-mail pendente.');
    }

    this.email = this.novoEmailPendente;
    this.novoEmailPendente = null;
    this.tokenConfirmacaoNovoEmail = null;
    this.tokenConfirmacaoNovoEmailExpiraEm = null;
  }
}

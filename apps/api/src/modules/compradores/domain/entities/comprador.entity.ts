import { calcularIdadeEm } from '../services/validacoes-comprador';

export type ProvedorLoginSocial = 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export class Comprador {
  constructor(
    public readonly id: string,
    public readonly grupoId: string,
    public nome: string,
    public apelido: string | null,
    public readonly dataNascimento: Date,
    public telefone: string,
    public readonly cpf: string,
    public endereco: string,
    public email: string | null,
    public senhaHash: string | null,
    public cashbackDisponivel: number,
    public readonly aceitouTermoEm: Date,
    public readonly criadoEm: Date,
    public googleId: string | null,
    public facebookId: string | null,
    public appleId: string | null,
    public tokenRecuperacaoSenha: string | null,
    public tokenRecuperacaoSenhaExpiraEm: Date | null,
  ) {}

  calcularIdade(agora: Date): number {
    return calcularIdadeEm(this.dataNascimento, agora);
  }

  debitarCashback(valor: number): void {
    if (valor <= 0) {
      throw new Error('O valor a debitar deve ser maior que zero.');
    }

    if (valor > this.cashbackDisponivel) {
      throw new Error('Cashback disponível insuficiente.');
    }

    this.cashbackDisponivel -= valor;
  }

  creditarCashback(valor: number): void {
    if (valor <= 0) {
      throw new Error('O valor a creditar deve ser maior que zero.');
    }

    this.cashbackDisponivel += valor;
  }

  vincularContaSocial(provedor: ProvedorLoginSocial, idExterno: string): void {
    if (provedor === 'GOOGLE') {
      this.googleId = idExterno;
    } else if (provedor === 'FACEBOOK') {
      this.facebookId = idExterno;
    } else {
      this.appleId = idExterno;
    }
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
}

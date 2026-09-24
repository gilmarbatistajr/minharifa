import { Comprador } from './comprador.entity';

function criarComprador(overrides: Partial<{
  cashbackDisponivel: number;
  tokenRecuperacaoSenha: string | null;
  tokenRecuperacaoSenhaExpiraEm: Date | null;
}> = {}): Comprador {
  return new Comprador(
    'comprador-1',
    'grupo-1',
    'Maria Silva',
    'Mari',
    new Date('1990-05-10'),
    '11912345678',
    '12345678909',
    'Rua das Flores, 123',
    'maria@example.com',
    'hash-antigo',
    overrides.cashbackDisponivel ?? 0,
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-01T00:00:00Z'),
    null,
    null,
    null,
    overrides.tokenRecuperacaoSenha ?? null,
    overrides.tokenRecuperacaoSenhaExpiraEm ?? null,
  );
}

describe('Comprador', () => {
  describe('calcularIdade', () => {
    it('delega para o cálculo de idade com base na data de nascimento', () => {
      const comprador = criarComprador();

      expect(comprador.calcularIdade(new Date('2026-06-01'))).toBe(36);
    });
  });

  describe('cashback', () => {
    it('debita um valor válido do cashback disponível', () => {
      const comprador = criarComprador({ cashbackDisponivel: 50 });

      comprador.debitarCashback(20);

      expect(comprador.cashbackDisponivel).toBe(30);
    });

    it('rejeita débito maior que o saldo disponível', () => {
      const comprador = criarComprador({ cashbackDisponivel: 20 });

      expect(() => comprador.debitarCashback(50)).toThrow('insuficiente');
    });

    it('rejeita débito de valor zero ou negativo', () => {
      const comprador = criarComprador({ cashbackDisponivel: 50 });

      expect(() => comprador.debitarCashback(0)).toThrow('maior que zero');
    });

    it('credita cashback na conta do comprador', () => {
      const comprador = criarComprador({ cashbackDisponivel: 10 });

      comprador.creditarCashback(15);

      expect(comprador.cashbackDisponivel).toBe(25);
    });

    it('rejeita crédito de valor zero ou negativo', () => {
      const comprador = criarComprador();

      expect(() => comprador.creditarCashback(-5)).toThrow('maior que zero');
    });
  });

  describe('vincularContaSocial', () => {
    it('vincula conta Google', () => {
      const comprador = criarComprador();

      comprador.vincularContaSocial('GOOGLE', 'google-123');

      expect(comprador.googleId).toBe('google-123');
    });

    it('vincula conta Facebook', () => {
      const comprador = criarComprador();

      comprador.vincularContaSocial('FACEBOOK', 'facebook-123');

      expect(comprador.facebookId).toBe('facebook-123');
    });

    it('vincula conta Apple', () => {
      const comprador = criarComprador();

      comprador.vincularContaSocial('APPLE', 'apple-123');

      expect(comprador.appleId).toBe('apple-123');
    });
  });

  describe('recuperação de senha', () => {
    it('gera token de recuperação com validade', () => {
      const comprador = criarComprador();
      const agora = new Date('2026-01-01T10:00:00Z');

      comprador.solicitarRecuperacaoSenha('token-abc', agora, 60);

      expect(comprador.tokenRecuperacaoSenha).toBe('token-abc');
      expect(comprador.tokenRecuperacaoSenhaExpiraEm).toEqual(new Date('2026-01-01T11:00:00Z'));
    });

    it('redefine a senha com token válido', () => {
      const comprador = criarComprador({
        tokenRecuperacaoSenha: 'token-abc',
        tokenRecuperacaoSenhaExpiraEm: new Date('2026-01-01T11:00:00Z'),
      });

      comprador.redefinirSenha('token-abc', 'hash-novo', new Date('2026-01-01T10:30:00Z'));

      expect(comprador.senhaHash).toBe('hash-novo');
      expect(comprador.tokenRecuperacaoSenha).toBeNull();
    });

    it('rejeita token inválido', () => {
      const comprador = criarComprador({
        tokenRecuperacaoSenha: 'token-abc',
        tokenRecuperacaoSenhaExpiraEm: new Date('2026-01-01T11:00:00Z'),
      });

      expect(() =>
        comprador.redefinirSenha('token-errado', 'hash-novo', new Date()),
      ).toThrow('inválido');
    });

    it('rejeita link expirado', () => {
      const comprador = criarComprador({
        tokenRecuperacaoSenha: 'token-abc',
        tokenRecuperacaoSenhaExpiraEm: new Date('2026-01-01T09:00:00Z'),
      });

      expect(() =>
        comprador.redefinirSenha('token-abc', 'hash-novo', new Date('2026-01-01T10:00:00Z')),
      ).toThrow('expirado');
    });
  });
});

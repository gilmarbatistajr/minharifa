import { Administrador } from './administrador.entity';

function criarAdministrador(overrides: Partial<{
  tokenConfirmacaoEmail: string | null;
  tokenConfirmacaoEmailExpiraEm: Date | null;
  tokenRecuperacaoSenha: string | null;
  tokenRecuperacaoSenhaExpiraEm: Date | null;
  novoEmailPendente: string | null;
  tokenConfirmacaoNovoEmail: string | null;
  tokenConfirmacaoNovoEmailExpiraEm: Date | null;
}> = {}): Administrador {
  return new Administrador(
    'admin-1',
    'João',
    'joao@example.com',
    'hash-antigo',
    false,
    new Date('2026-01-01T00:00:00Z'),
    overrides.tokenConfirmacaoEmail ?? null,
    overrides.tokenConfirmacaoEmailExpiraEm ?? null,
    overrides.tokenRecuperacaoSenha ?? null,
    overrides.tokenRecuperacaoSenhaExpiraEm ?? null,
    overrides.novoEmailPendente ?? null,
    overrides.tokenConfirmacaoNovoEmail ?? null,
    overrides.tokenConfirmacaoNovoEmailExpiraEm ?? null,
  );
}

describe('Administrador', () => {
  describe('confirmarEmail', () => {
    it('confirma o e-mail com um token válido e não expirado', () => {
      const admin = criarAdministrador({
        tokenConfirmacaoEmail: 'token-123',
        tokenConfirmacaoEmailExpiraEm: new Date('2026-01-02T00:00:00Z'),
      });

      admin.confirmarEmail('token-123', new Date('2026-01-01T12:00:00Z'));

      expect(admin.emailConfirmado).toBe(true);
      expect(admin.tokenConfirmacaoEmail).toBeNull();
    });

    it('rejeita token inválido', () => {
      const admin = criarAdministrador({
        tokenConfirmacaoEmail: 'token-123',
        tokenConfirmacaoEmailExpiraEm: new Date('2026-01-02T00:00:00Z'),
      });

      expect(() => admin.confirmarEmail('token-errado', new Date())).toThrow('inválido');
    });

    it('rejeita token expirado', () => {
      const admin = criarAdministrador({
        tokenConfirmacaoEmail: 'token-123',
        tokenConfirmacaoEmailExpiraEm: new Date('2026-01-01T00:00:00Z'),
      });

      expect(() =>
        admin.confirmarEmail('token-123', new Date('2026-01-02T00:00:00Z')),
      ).toThrow('expirado');
    });
  });

  describe('recuperação de senha', () => {
    it('gera token de recuperação com prazo de validade', () => {
      const admin = criarAdministrador();
      const agora = new Date('2026-01-01T10:00:00Z');

      admin.solicitarRecuperacaoSenha('token-abc', agora, 60);

      expect(admin.tokenRecuperacaoSenha).toBe('token-abc');
      expect(admin.tokenRecuperacaoSenhaExpiraEm).toEqual(new Date('2026-01-01T11:00:00Z'));
    });

    it('redefine a senha com token válido', () => {
      const admin = criarAdministrador({
        tokenRecuperacaoSenha: 'token-abc',
        tokenRecuperacaoSenhaExpiraEm: new Date('2026-01-01T11:00:00Z'),
      });

      admin.redefinirSenha('token-abc', 'novo-hash', new Date('2026-01-01T10:30:00Z'));

      expect(admin.senhaHash).toBe('novo-hash');
      expect(admin.tokenRecuperacaoSenha).toBeNull();
    });

    it('rejeita redefinição com token inválido', () => {
      const admin = criarAdministrador({
        tokenRecuperacaoSenha: 'token-abc',
        tokenRecuperacaoSenhaExpiraEm: new Date('2026-01-01T11:00:00Z'),
      });

      expect(() =>
        admin.redefinirSenha('token-errado', 'novo-hash', new Date()),
      ).toThrow('inválido');
    });

    it('rejeita redefinição com link expirado', () => {
      const admin = criarAdministrador({
        tokenRecuperacaoSenha: 'token-abc',
        tokenRecuperacaoSenhaExpiraEm: new Date('2026-01-01T09:00:00Z'),
      });

      expect(() =>
        admin.redefinirSenha('token-abc', 'novo-hash', new Date('2026-01-01T10:00:00Z')),
      ).toThrow('expirado');
    });
  });

  describe('trocarSenha', () => {
    it('substitui o hash da senha diretamente', () => {
      const admin = criarAdministrador();

      admin.trocarSenha('hash-novo');

      expect(admin.senhaHash).toBe('hash-novo');
    });
  });

  describe('atualizarNome', () => {
    it('atualiza o nome', () => {
      const admin = criarAdministrador();

      admin.atualizarNome('João da Silva');

      expect(admin.nome).toBe('João da Silva');
    });

    it('rejeita nome vazio', () => {
      const admin = criarAdministrador();

      expect(() => admin.atualizarNome('   ')).toThrow('não pode ser vazio');
    });
  });

  describe('troca de e-mail', () => {
    it('solicita troca de e-mail gerando token com validade em horas', () => {
      const admin = criarAdministrador();
      const agora = new Date('2026-01-01T00:00:00Z');

      admin.solicitarTrocaEmail('novo@example.com', 'token-email', agora, 48);

      expect(admin.novoEmailPendente).toBe('novo@example.com');
      expect(admin.tokenConfirmacaoNovoEmail).toBe('token-email');
      expect(admin.tokenConfirmacaoNovoEmailExpiraEm).toEqual(new Date('2026-01-03T00:00:00Z'));
    });

    it('confirma o novo e-mail com token válido', () => {
      const admin = criarAdministrador({
        novoEmailPendente: 'novo@example.com',
        tokenConfirmacaoNovoEmail: 'token-email',
        tokenConfirmacaoNovoEmailExpiraEm: new Date('2026-01-03T00:00:00Z'),
      });

      admin.confirmarNovoEmail('token-email', new Date('2026-01-02T00:00:00Z'));

      expect(admin.email).toBe('novo@example.com');
      expect(admin.novoEmailPendente).toBeNull();
    });

    it('rejeita confirmação com token inválido', () => {
      const admin = criarAdministrador({
        novoEmailPendente: 'novo@example.com',
        tokenConfirmacaoNovoEmail: 'token-email',
        tokenConfirmacaoNovoEmailExpiraEm: new Date('2026-01-03T00:00:00Z'),
      });

      expect(() => admin.confirmarNovoEmail('token-errado', new Date())).toThrow('inválido');
    });

    it('rejeita confirmação com token expirado', () => {
      const admin = criarAdministrador({
        novoEmailPendente: 'novo@example.com',
        tokenConfirmacaoNovoEmail: 'token-email',
        tokenConfirmacaoNovoEmailExpiraEm: new Date('2026-01-01T00:00:00Z'),
      });

      expect(() =>
        admin.confirmarNovoEmail('token-email', new Date('2026-01-02T00:00:00Z')),
      ).toThrow('expirado');
    });

    it('rejeita confirmação sem solicitação pendente', () => {
      const admin = criarAdministrador({
        tokenConfirmacaoNovoEmail: 'token-email',
        tokenConfirmacaoNovoEmailExpiraEm: new Date('2026-01-03T00:00:00Z'),
      });

      expect(() =>
        admin.confirmarNovoEmail('token-email', new Date('2026-01-02T00:00:00Z')),
      ).toThrow('Não há troca de e-mail pendente');
    });
  });
});

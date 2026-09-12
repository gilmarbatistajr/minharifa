import { EscolhaPosCancelamento } from './escolha-pos-cancelamento.entity';

function criarEscolha(
  overrides: Partial<{ status: EscolhaPosCancelamento['status']; prazoExpiraEm: Date }> = {},
): EscolhaPosCancelamento {
  return new EscolhaPosCancelamento(
    'escolha-1',
    'sorteio-1',
    'comprador-maria',
    3,
    150,
    overrides.status ?? 'PENDENTE',
    overrides.prazoExpiraEm ?? new Date('2026-01-10T00:00:00Z'),
    null,
    new Date('2026-01-01T00:00:00Z'),
  );
}

describe('EscolhaPosCancelamento', () => {
  describe('escolherReembolso', () => {
    it('registra a escolha de reembolso dentro do prazo', () => {
      const escolha = criarEscolha();
      const agora = new Date('2026-01-05T00:00:00Z');

      escolha.escolherReembolso(agora);

      expect(escolha.status).toBe('REEMBOLSO');
      expect(escolha.decididoEm).toBe(agora);
    });

    it('rejeita escolher reembolso fora do prazo', () => {
      const escolha = criarEscolha();

      expect(() => escolha.escolherReembolso(new Date('2026-01-11T00:00:00Z'))).toThrow(
        'prazo',
      );
    });

    it('rejeita escolher reembolso de uma escolha já decidida', () => {
      const escolha = criarEscolha({ status: 'CASHBACK' });

      expect(() => escolha.escolherReembolso(new Date('2026-01-05T00:00:00Z'))).toThrow(
        'já foi decidida',
      );
    });
  });

  describe('escolherManterCotas', () => {
    it('registra a escolha de manter cotas dentro do prazo', () => {
      const escolha = criarEscolha();
      const agora = new Date('2026-01-05T00:00:00Z');

      escolha.escolherManterCotas(agora);

      expect(escolha.status).toBe('CREDITO_PROXIMO_SORTEIO');
    });
  });

  describe('expirarParaCashback', () => {
    it('converte em cashback quando o prazo expirou sem decisão', () => {
      const escolha = criarEscolha();
      const agora = new Date('2026-01-11T00:00:00Z');

      escolha.expirarParaCashback(agora);

      expect(escolha.status).toBe('CASHBACK');
      expect(escolha.decididoEm).toBe(agora);
    });

    it('rejeita expirar antes do prazo terminar', () => {
      const escolha = criarEscolha();

      expect(() => escolha.expirarParaCashback(new Date('2026-01-05T00:00:00Z'))).toThrow(
        'ainda não expirou',
      );
    });

    it('rejeita expirar uma escolha já decidida', () => {
      const escolha = criarEscolha({ status: 'REEMBOLSO' });

      expect(() => escolha.expirarParaCashback(new Date('2026-01-11T00:00:00Z'))).toThrow(
        'já foi decidida',
      );
    });
  });
});

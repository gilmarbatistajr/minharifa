import { Sorteio } from './sorteio.entity';

describe('Sorteio', () => {
  describe('cancelar', () => {
    it('cancela um sorteio com vendas em andamento', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-10T00:00:00Z'),
        new Date('2026-01-11T00:00:00Z'),
        100,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      sorteio.cancelar();

      expect(sorteio.status).toBe('CANCELADO');
    });

    it('impede cancelar um sorteio já finalizado', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-10T00:00:00Z'),
        new Date('2026-01-11T00:00:00Z'),
        100,
          50,
        'FINALIZADO',
        42,
        false,
      );

      expect(() => sorteio.cancelar()).toThrow('não pode ser cancelado');
    });

    it('impede cancelar um sorteio já cancelado', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-10T00:00:00Z'),
        new Date('2026-01-11T00:00:00Z'),
        100,
          50,
        'CANCELADO',
        null,
        null,
      );

      expect(() => sorteio.cancelar()).toThrow('não pode ser cancelado');
    });
  });

  describe('estaEncerrandoEm24h', () => {
    it('retorna true quando faltam menos de 24h para o encerramento', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-10T12:00:00Z'),
        new Date('2026-01-11T00:00:00Z'),
        100,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      expect(sorteio.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(true);
    });

    it('retorna false quando faltam mais de 24h', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-15T00:00:00Z'),
        new Date('2026-01-16T00:00:00Z'),
        100,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      expect(sorteio.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });

    it('retorna false se o sorteio não está com vendas abertas', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-10T12:00:00Z'),
        new Date('2026-01-11T00:00:00Z'),
        100,
          50,
        'COTAS_ESGOTADAS',
        null,
        null,
      );

      expect(sorteio.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });

    it('retorna false se a data de encerramento já passou', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-09T00:00:00Z'),
        new Date('2026-01-11T00:00:00Z'),
        100,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      expect(sorteio.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });
  });

  describe('estaAguardandoResultado', () => {
    it('retorna true quando as cotas estão esgotadas', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date(),
        new Date(),
        new Date(),
        100,
          50,
        'COTAS_ESGOTADAS',
        null,
        null,
      );

      expect(sorteio.estaAguardandoResultado()).toBe(true);
    });

    it('retorna false em qualquer outro status', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date(),
        new Date(),
        new Date(),
        100,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      expect(sorteio.estaAguardandoResultado()).toBe(false);
    });
  });

  describe('calcularPercentualVendido', () => {
    it('calcula o percentual arredondado de cotas pagas', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date(),
        new Date(),
        new Date(),
        200,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      expect(sorteio.calcularPercentualVendido(50)).toBe(25);
    });

    it('retorna 0 quando o sorteio não tem cotas', () => {
      const sorteio = new Sorteio(
        'sorteio-1',
        'grupo-1',
        'premio-1',
        new Date(),
        new Date(),
        new Date(),
        0,
          50,
        'VENDAS_ABERTAS',
        null,
        null,
      );

      expect(sorteio.calcularPercentualVendido(0)).toBe(0);
    });
  });
});

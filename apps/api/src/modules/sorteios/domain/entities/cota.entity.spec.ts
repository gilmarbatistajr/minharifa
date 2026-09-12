import { Cota } from './cota.entity';

describe('Cota (entidade de domínio)', () => {
  describe('confirmarPagamento', () => {
    it('confirma o pagamento de uma cota reservada', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());

      cota.confirmarPagamento();

      expect(cota.status).toBe('PAGA');
    });

    it('lança erro ao tentar confirmar pagamento de cota que não está reservada', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'DISPONIVEL', null, null, null);

      expect(() => cota.confirmarPagamento()).toThrow('não está reservada');
    });
  });

  describe('pagarComCredito', () => {
    it('paga diretamente uma cota disponível', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'DISPONIVEL', null, null, null);
      const agora = new Date('2026-01-01T10:00:00Z');

      cota.pagarComCredito('comprador-maria', agora);

      expect(cota.status).toBe('PAGA');
      expect(cota.compradorId).toBe('comprador-maria');
      expect(cota.reservadaEm).toBe(agora);
      expect(cota.reservaExpiraEm).toBeNull();
    });

    it('rejeita pagar com crédito uma cota que não está disponível', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'RESERVADA', 'comprador-joao', new Date(), new Date());

      expect(() => cota.pagarComCredito('comprador-maria', new Date())).toThrow('não está disponível');
    });
  });

  describe('cancelarEReembolsar', () => {
    it('marca uma cota paga como cancelada e reembolsada', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'PAGA', 'comprador-maria', new Date(), null);

      cota.cancelarEReembolsar();

      expect(cota.status).toBe('CANCELADA_REEMBOLSADA');
    });

    it('rejeita reembolsar uma cota que não está paga', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());

      expect(() => cota.cancelarEReembolsar()).toThrow('não está paga');
    });
  });

  describe('liberar', () => {
    it('libera uma cota reservada, limpando comprador e prazos', () => {
      const cota = new Cota('cota-1', 'sorteio-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());

      cota.liberar();

      expect(cota.status).toBe('DISPONIVEL');
      expect(cota.compradorId).toBeNull();
      expect(cota.reservadaEm).toBeNull();
      expect(cota.reservaExpiraEm).toBeNull();
    });
  });
});

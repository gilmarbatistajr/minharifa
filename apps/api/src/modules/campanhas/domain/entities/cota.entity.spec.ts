import { Cota } from './cota.entity';

describe('Cota (entidade de domínio)', () => {
  describe('confirmarPagamento', () => {
    it('confirma o pagamento de uma cota reservada', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());

      cota.confirmarPagamento();

      expect(cota.status).toBe('PAGA');
    });

    it('lança erro ao tentar confirmar pagamento de cota que não está reservada', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);

      expect(() => cota.confirmarPagamento()).toThrow('não está reservada');
    });
  });

  describe('pagarComCredito', () => {
    it('paga diretamente uma cota disponível', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
      const agora = new Date('2026-01-01T10:00:00Z');

      cota.pagarComCredito('comprador-maria', agora);

      expect(cota.status).toBe('PAGA');
      expect(cota.compradorId).toBe('comprador-maria');
      expect(cota.reservadaEm).toBe(agora);
      expect(cota.reservaExpiraEm).toBeNull();
    });

    it('rejeita pagar com crédito uma cota que não está disponível', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'RESERVADA', 'comprador-joao', new Date(), new Date());

      expect(() => cota.pagarComCredito('comprador-maria', new Date())).toThrow('não está disponível');
    });
  });

  describe('cancelarEReembolsar', () => {
    it('marca uma cota paga como cancelada e reembolsada', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'PAGA', 'comprador-maria', new Date(), null);

      cota.cancelarEReembolsar();

      expect(cota.status).toBe('CANCELADA_REEMBOLSADA');
    });

    it('rejeita reembolsar uma cota que não está paga', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());

      expect(() => cota.cancelarEReembolsar()).toThrow('não está paga');
    });
  });

  describe('liberar', () => {
    it('libera uma cota reservada, limpando comprador e prazos', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());

      cota.liberar();

      expect(cota.status).toBe('DISPONIVEL');
      expect(cota.compradorId).toBeNull();
      expect(cota.reservadaEm).toBeNull();
      expect(cota.reservaExpiraEm).toBeNull();
    });

    it('libera uma cota reservada por um convidado, limpando também o contato', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
      const agora = new Date('2026-01-01T10:00:00Z');
      cota.reservarParaConvidado(
        'token-1',
        { nome: 'Maria', email: 'maria@exemplo.com', telefone: '11988887777' },
        agora,
        2,
      );

      cota.liberar();

      expect(cota.status).toBe('DISPONIVEL');
      expect(cota.tokenReservaConvidado).toBeNull();
      expect(cota.convidadoNome).toBeNull();
      expect(cota.convidadoEmail).toBeNull();
      expect(cota.convidadoTelefone).toBeNull();
    });
  });

  describe('reservarParaConvidado', () => {
    it('reserva uma cota disponível pra um convidado, sem compradorId', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
      const agora = new Date('2026-01-01T10:00:00Z');

      cota.reservarParaConvidado(
        'token-1',
        { nome: 'Maria', email: 'maria@exemplo.com', telefone: '11988887777' },
        agora,
        2,
      );

      expect(cota.status).toBe('RESERVADA');
      expect(cota.compradorId).toBeNull();
      expect(cota.tokenReservaConvidado).toBe('token-1');
      expect(cota.convidadoNome).toBe('Maria');
      expect(cota.convidadoEmail).toBe('maria@exemplo.com');
      expect(cota.convidadoTelefone).toBe('11988887777');
      expect(cota.reservadaEm).toBe(agora);
      expect(cota.reservaExpiraEm).toEqual(new Date('2026-01-01T10:02:00Z'));
    });

    it('rejeita reservar pra um convidado uma cota já reservada por outra pessoa e ainda dentro do prazo', () => {
      const cota = new Cota(
        'cota-1',
        'campanha-1',
        42,
        'RESERVADA',
        'comprador-joao',
        new Date(),
        new Date('2099-01-01T00:00:00Z'),
      );

      expect(() =>
        cota.reservarParaConvidado('token-1', { nome: null, email: null, telefone: null }, new Date(), 2),
      ).toThrow('não está disponível para reserva');
    });
  });

  describe('reservarPara', () => {
    it('limpa um contato de convidado remanescente ao reservar pra um comprador com conta', () => {
      const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
      const agora = new Date('2026-01-01T10:00:00Z');
      cota.reservarParaConvidado(
        'token-1',
        { nome: 'Maria', email: 'maria@exemplo.com', telefone: '11988887777' },
        agora,
        2,
      );
      cota.liberar();

      cota.reservarPara('comprador-joao', agora, 2);

      expect(cota.compradorId).toBe('comprador-joao');
      expect(cota.tokenReservaConvidado).toBeNull();
      expect(cota.convidadoNome).toBeNull();
    });
  });
});

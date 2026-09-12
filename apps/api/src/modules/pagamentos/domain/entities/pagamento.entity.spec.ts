import { Pagamento } from './pagamento.entity';

function criarPagamento(overrides: Partial<{ status: Pagamento['status']; valorCashbackAplicado: number }> = {}): Pagamento {
  return new Pagamento(
    'pagamento-1',
    'cota-1',
    'comprador-1',
    50,
    overrides.valorCashbackAplicado ?? 0,
    'PIX',
    overrides.status ?? 'PENDENTE',
    null,
    new Date(),
  );
}

describe('Pagamento', () => {
  describe('calcularValorRestante', () => {
    it('retorna o valor total quando nenhum cashback foi aplicado', () => {
      expect(criarPagamento().calcularValorRestante()).toBe(50);
    });

    it('retorna o valor restante após abater o cashback aplicado', () => {
      expect(criarPagamento({ valorCashbackAplicado: 20 }).calcularValorRestante()).toBe(30);
    });
  });

  describe('atualizarCobranca', () => {
    it('atualiza método e transação de um pagamento pendente', () => {
      const pagamento = criarPagamento();

      pagamento.atualizarCobranca('CARTAO_CREDITO', 'txn-123');

      expect(pagamento.metodo).toBe('CARTAO_CREDITO');
      expect(pagamento.idTransacaoGateway).toBe('txn-123');
    });

    it('permite nova tentativa de cobrança após uma recusa, voltando a pendente', () => {
      const pagamento = criarPagamento({ status: 'RECUSADO' });

      pagamento.atualizarCobranca('PIX', 'txn-456');

      expect(pagamento.status).toBe('PENDENTE');
      expect(pagamento.idTransacaoGateway).toBe('txn-456');
    });

    it('rejeita atualizar cobrança de pagamento já aprovado', () => {
      const pagamento = criarPagamento({ status: 'APROVADO' });

      expect(() => pagamento.atualizarCobranca('PIX', 'txn-123')).toThrow('já foi processado');
    });

    it('rejeita atualizar cobrança de pagamento já estornado', () => {
      const pagamento = criarPagamento({ status: 'ESTORNADO' });

      expect(() => pagamento.atualizarCobranca('PIX', 'txn-123')).toThrow('já foi processado');
    });
  });

  describe('aprovar', () => {
    it('aprova um pagamento pendente', () => {
      const pagamento = criarPagamento();

      pagamento.aprovar();

      expect(pagamento.status).toBe('APROVADO');
    });

    it('aprova um pagamento previamente recusado (ex: pago em nova tentativa com cashback)', () => {
      const pagamento = criarPagamento({ status: 'RECUSADO' });

      pagamento.aprovar();

      expect(pagamento.status).toBe('APROVADO');
    });

    it('rejeita aprovar um pagamento já aprovado', () => {
      const pagamento = criarPagamento({ status: 'APROVADO' });

      expect(() => pagamento.aprovar()).toThrow('pendentes podem ser aprovados');
    });

    it('rejeita aprovar um pagamento já estornado', () => {
      const pagamento = criarPagamento({ status: 'ESTORNADO' });

      expect(() => pagamento.aprovar()).toThrow('pendentes podem ser aprovados');
    });
  });

  describe('recusar', () => {
    it('recusa um pagamento pendente', () => {
      const pagamento = criarPagamento();

      pagamento.recusar();

      expect(pagamento.status).toBe('RECUSADO');
    });

    it('rejeita recusar um pagamento que não está pendente', () => {
      const pagamento = criarPagamento({ status: 'APROVADO' });

      expect(() => pagamento.recusar()).toThrow('pendentes podem ser recusados');
    });
  });

  describe('estornar', () => {
    it('estorna um pagamento aprovado', () => {
      const pagamento = criarPagamento({ status: 'APROVADO' });

      pagamento.estornar();

      expect(pagamento.status).toBe('ESTORNADO');
    });

    it('estorna um pagamento ainda pendente (webhook tardio)', () => {
      const pagamento = criarPagamento({ status: 'PENDENTE' });

      pagamento.estornar();

      expect(pagamento.status).toBe('ESTORNADO');
    });

    it('rejeita estornar um pagamento já estornado', () => {
      const pagamento = criarPagamento({ status: 'ESTORNADO' });

      expect(() => pagamento.estornar()).toThrow('não pode ser estornado');
    });

    it('rejeita estornar um pagamento recusado', () => {
      const pagamento = criarPagamento({ status: 'RECUSADO' });

      expect(() => pagamento.estornar()).toThrow('não pode ser estornado');
    });
  });
});

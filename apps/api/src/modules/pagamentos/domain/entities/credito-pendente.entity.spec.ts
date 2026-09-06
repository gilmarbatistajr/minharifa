import { CreditoPendente } from './credito-pendente.entity';

describe('CreditoPendente', () => {
  function criarCredito(utilizado = false): CreditoPendente {
    return new CreditoPendente(
      'credito-1',
      'comprador-maria',
      'grupo-1',
      'sorteio-1',
      3,
      150,
      utilizado,
      new Date(),
    );
  }

  it('marca um crédito disponível como utilizado', () => {
    const credito = criarCredito();

    credito.marcarComoUtilizado();

    expect(credito.utilizado).toBe(true);
  });

  it('rejeita utilizar um crédito já utilizado', () => {
    const credito = criarCredito(true);

    expect(() => credito.marcarComoUtilizado()).toThrow('já foi utilizado');
  });
});

import { resolverChavePix } from './resolver-chave-pix';

describe('resolverChavePix', () => {
  it('retorna nulo para os dois quando nenhum foi informado', () => {
    expect(resolverChavePix(null, null)).toEqual({ tipoChavePix: null, chavePix: null });
    expect(resolverChavePix(undefined, undefined)).toEqual({ tipoChavePix: null, chavePix: null });
  });

  it('valida e normaliza uma chave CPF válida', () => {
    expect(resolverChavePix('CPF', '529.982.247-25')).toEqual({
      tipoChavePix: 'CPF',
      chavePix: '52998224725',
    });
  });

  it('valida e normaliza uma chave celular válida', () => {
    expect(resolverChavePix('CELULAR', '(11) 91234-5678')).toEqual({
      tipoChavePix: 'CELULAR',
      chavePix: '+5511912345678',
    });
  });

  it('rejeita quando o tipo é informado mas a chave está vazia', () => {
    expect(() => resolverChavePix('CPF', null)).toThrow('Informe o tipo e o valor da chave Pix juntos.');
    expect(() => resolverChavePix('CPF', '   ')).toThrow('Informe o tipo e o valor da chave Pix juntos.');
  });

  it('rejeita quando a chave é informada mas o tipo não foi escolhido', () => {
    expect(() => resolverChavePix(null, '529.982.247-25')).toThrow(
      'Informe o tipo e o valor da chave Pix juntos.',
    );
  });

  it('rejeita um CPF com dígito verificador inválido, com a mensagem específica do tipo', () => {
    expect(() => resolverChavePix('CPF', '529.982.247-26')).toThrow(
      'A chave Pix informada não é um CPF válido.',
    );
  });

  it('rejeita um e-mail em formato inválido', () => {
    expect(() => resolverChavePix('EMAIL', 'nao-e-email')).toThrow(
      'A chave Pix informada não é um e-mail válido.',
    );
  });
});

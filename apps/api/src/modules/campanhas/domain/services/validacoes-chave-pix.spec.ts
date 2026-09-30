import {
  validarCpf,
  validarCnpj,
  validarCelular,
  validarEmail,
  validarChaveAleatoria,
  validarChavePix,
  normalizarChavePix,
} from './validacoes-chave-pix';

describe('validarCpf', () => {
  it('aceita um CPF válido, com ou sem máscara', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('52998224725')).toBe(true);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(validarCpf('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(validarCpf('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com quantidade errada de dígitos', () => {
    expect(validarCpf('123456789')).toBe(false);
  });
});

describe('validarCnpj', () => {
  it('aceita um CNPJ válido, com ou sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(validarCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(validarCnpj('11.111.111/1111-11')).toBe(false);
  });
});

describe('validarCelular', () => {
  it('aceita um celular brasileiro válido (DDD + 9 + 8 dígitos)', () => {
    expect(validarCelular('(11) 91234-5678')).toBe(true);
    expect(validarCelular('11912345678')).toBe(true);
  });

  it('rejeita um telefone fixo (sem o 9 na frente)', () => {
    expect(validarCelular('1131234567')).toBe(false);
  });

  it('rejeita número com quantidade errada de dígitos', () => {
    expect(validarCelular('119123456')).toBe(false);
  });
});

describe('validarEmail', () => {
  it('aceita e-mails válidos', () => {
    expect(validarEmail('nome@dominio.com')).toBe(true);
  });

  it('rejeita strings sem @ ou sem domínio', () => {
    expect(validarEmail('nome-em-dominio.com')).toBe(false);
    expect(validarEmail('nome@dominio')).toBe(false);
  });
});

describe('validarChaveAleatoria', () => {
  it('aceita um UUID no formato 8-4-4-4-12', () => {
    expect(validarChaveAleatoria('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('rejeita string sem os hifens nas posições certas', () => {
    expect(validarChaveAleatoria('123e4567e89b12d3a456426614174000')).toBe(false);
  });
});

describe('validarChavePix', () => {
  it('roteia para o validador certo conforme o tipo', () => {
    expect(validarChavePix('CPF', '529.982.247-25')).toBe(true);
    expect(validarChavePix('CPF', '111.111.111-11')).toBe(false);
    expect(validarChavePix('EMAIL', 'nome@dominio.com')).toBe(true);
  });
});

describe('normalizarChavePix', () => {
  it('reduz CPF e CNPJ a só dígitos', () => {
    expect(normalizarChavePix('CPF', '529.982.247-25')).toBe('52998224725');
    expect(normalizarChavePix('CNPJ', '11.222.333/0001-81')).toBe('11222333000181');
  });

  it('formata celular em E.164 (+55 e só dígitos)', () => {
    expect(normalizarChavePix('CELULAR', '(11) 91234-5678')).toBe('+5511912345678');
  });

  it('não duplica o DDI quando o número já vem com 55 na frente', () => {
    expect(normalizarChavePix('CELULAR', '5511912345678')).toBe('+5511912345678');
  });

  it('deixa e-mail e chave aleatória em minúsculas', () => {
    expect(normalizarChavePix('EMAIL', 'Nome@Dominio.COM')).toBe('nome@dominio.com');
    expect(normalizarChavePix('ALEATORIA', '123E4567-E89B-12D3-A456-426614174000')).toBe(
      '123e4567-e89b-12d3-a456-426614174000',
    );
  });
});

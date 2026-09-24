import { calcularIdadeEm, validarCpf, validarTelefone } from './validacoes-comprador';

describe('calcularIdadeEm', () => {
  it('calcula a idade quando o aniversário do ano já ocorreu', () => {
    expect(calcularIdadeEm(new Date('1990-05-10'), new Date('2026-06-01'))).toBe(36);
  });

  it('calcula a idade quando o aniversário do ano ainda não ocorreu', () => {
    expect(calcularIdadeEm(new Date('1990-12-10'), new Date('2026-06-01'))).toBe(35);
  });

  it('calcula exatamente 18 anos no dia do aniversário', () => {
    expect(calcularIdadeEm(new Date('2008-06-01'), new Date('2026-06-01'))).toBe(18);
  });

  it('calcula 17 anos um dia antes de completar 18', () => {
    expect(calcularIdadeEm(new Date('2008-06-01'), new Date('2026-05-31'))).toBe(17);
  });
});

describe('validarCpf', () => {
  it('aceita um CPF válido com máscara', () => {
    expect(validarCpf('123.456.789-09')).toBe(true);
  });

  it('aceita um CPF válido sem máscara', () => {
    expect(validarCpf('12345678909')).toBe(true);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validarCpf('123.456.789')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(validarCpf('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com dígito verificador incorreto', () => {
    expect(validarCpf('123.456.789-00')).toBe(false);
  });
});

describe('validarTelefone', () => {
  it('aceita celular com DDD e máscara', () => {
    expect(validarTelefone('(11) 91234-5678')).toBe(true);
  });

  it('aceita fixo com DDD e máscara', () => {
    expect(validarTelefone('(11) 1234-5678')).toBe(true);
  });

  it('aceita telefone com DDI do Brasil', () => {
    expect(validarTelefone('+55 11 91234-5678')).toBe(true);
  });

  it('rejeita telefone com formato inválido (poucos dígitos)', () => {
    expect(validarTelefone('123')).toBe(false);
  });
});

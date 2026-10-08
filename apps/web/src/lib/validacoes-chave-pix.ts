import type { TipoChavePix } from './api';

/** Mesmo algoritmo oficial de dígitos verificadores usado no backend. */
export function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, '');

  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  const calcularDigitoVerificador = (base: string, pesoInicial: number): number => {
    const soma = base
      .split('')
      .reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiroDigito = calcularDigitoVerificador(digitos.slice(0, 9), 10);
  const segundoDigito = calcularDigitoVerificador(digitos.slice(0, 10), 11);

  return primeiroDigito === Number(digitos[9]) && segundoDigito === Number(digitos[10]);
}

export function validarCnpj(cnpj: string): boolean {
  const digitos = cnpj.replace(/\D/g, '');

  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) {
    return false;
  }

  const calcularDigitoVerificador = (base: string, pesos: number[]): number => {
    const soma = base.split('').reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const primeiroDigito = calcularDigitoVerificador(digitos.slice(0, 12), pesosPrimeiroDigito);
  const segundoDigito = calcularDigitoVerificador(digitos.slice(0, 13), pesosSegundoDigito);

  return primeiroDigito === Number(digitos[12]) && segundoDigito === Number(digitos[13]);
}

export function validarCelular(numero: string): boolean {
  const digitos = numero.replace(/\D/g, '');
  return /^\d{2}9\d{8}$/.test(digitos);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validarChaveAleatoria(valor: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(valor.trim());
}

export function validarChavePix(tipo: TipoChavePix, chave: string): boolean {
  switch (tipo) {
    case 'CPF':
      return validarCpf(chave);
    case 'CNPJ':
      return validarCnpj(chave);
    case 'CELULAR':
      return validarCelular(chave);
    case 'EMAIL':
      return validarEmail(chave);
    case 'ALEATORIA':
      return validarChaveAleatoria(chave);
    default:
      return false;
  }
}

export const MENSAGENS_ERRO_CHAVE_PIX: Record<TipoChavePix, string> = {
  CPF: 'Esse CPF não é válido.',
  CNPJ: 'Esse CNPJ não é válido.',
  CELULAR: 'Esse celular não é válido — use o formato (DDD) 9XXXX-XXXX.',
  EMAIL: 'Esse e-mail não é válido.',
  ALEATORIA: 'Essa chave aleatória (EVP) não é válida.',
};

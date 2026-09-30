import { TipoChavePix } from '../entities/campanha.entity';

/** Mesmo algoritmo oficial de dígitos verificadores usado para o CPF do comprador. */
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

/** Algoritmo oficial de dígitos verificadores do CNPJ. */
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

/** Celular brasileiro: DDD (2 dígitos) + 9 (prefixo de celular) + 8 dígitos = 11 dígitos. */
export function validarCelular(numero: string): boolean {
  const digitos = numero.replace(/\D/g, '');
  return /^\d{2}9\d{8}$/.test(digitos);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Chave aleatória (EVP): sempre um UUID, com os hifens nas posições 8-4-4-4-12. */
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

/**
 * Formato canônico exigido pelo Pix — sem máscara de digitação: CPF/CNPJ só
 * dígitos, celular em E.164 (+55...), e-mail e chave aleatória em minúsculas.
 * Sem isso, o BR Code gerado (`gerarPixCopiaECola`) teria uma chave inválida
 * para o banco do comprador.
 */
export function normalizarChavePix(tipo: TipoChavePix, chave: string): string {
  switch (tipo) {
    case 'CPF':
    case 'CNPJ':
      return chave.replace(/\D/g, '');
    case 'CELULAR': {
      const digitos = chave.replace(/\D/g, '');
      const semDdiBrasil = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;
      return `+55${semDdiBrasil}`;
    }
    case 'EMAIL':
    case 'ALEATORIA':
      return chave.trim().toLowerCase();
    default:
      return chave.trim();
  }
}

export const MENSAGENS_ERRO_CHAVE_PIX: Record<TipoChavePix, string> = {
  CPF: 'A chave Pix informada não é um CPF válido.',
  CNPJ: 'A chave Pix informada não é um CNPJ válido.',
  CELULAR: 'A chave Pix informada não é um celular válido — use o formato (DDD) 9XXXX-XXXX.',
  EMAIL: 'A chave Pix informada não é um e-mail válido.',
  ALEATORIA: 'A chave Pix informada não é uma chave aleatória (EVP) válida.',
};

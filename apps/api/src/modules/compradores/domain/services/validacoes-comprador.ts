/** Calcula a idade completa em anos na data de referência informada. */
export function calcularIdadeEm(dataNascimento: Date, agora: Date): number {
  let idade = agora.getFullYear() - dataNascimento.getFullYear();
  const aniversarioJaOcorreuNoAno =
    agora.getMonth() > dataNascimento.getMonth() ||
    (agora.getMonth() === dataNascimento.getMonth() && agora.getDate() >= dataNascimento.getDate());

  if (!aniversarioJaOcorreuNoAno) {
    idade -= 1;
  }

  return idade;
}

/** Valida um CPF (com ou sem máscara) pelo algoritmo oficial de dígitos verificadores. */
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

/** Valida um telefone brasileiro (com ou sem máscara/DDI), aceitando fixo (10) ou celular (11 dígitos). */
export function validarTelefone(telefone: string): boolean {
  const digitos = telefone.replace(/\D/g, '');
  const digitosSemDdiBrasil = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;

  return digitosSemDdiBrasil.length === 10 || digitosSemDdiBrasil.length === 11;
}

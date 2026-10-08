export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ROTULOS_STATUS_VENDAS_CAMPANHA: Record<string, string> = {
  AGUARDANDO_ABERTURA: 'Aguardando abertura',
  VENDAS_ABERTAS: 'Vendas abertas',
  VENDAS_ENCERRADAS: 'Vendas encerradas',
  COTAS_ESGOTADAS: 'Cotas esgotadas',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export function formatarStatusVendasCampanha(status: string): string {
  return ROTULOS_STATUS_VENDAS_CAMPANHA[status] ?? status;
}

const ROTULOS_STATUS_CAMPANHA: Record<string, string> = {
  NOVO: 'Novo',
  AGUARDANDO_LIBERACAO: 'Aguardando liberação',
  LIBERADA: 'Vendas abertas',
  LIBERADA_PARA_SORTEIO: 'Vendas encerradas',
  FINALIZADA: 'Finalizada',
};

export function formatarStatusCampanha(status: string): string {
  return ROTULOS_STATUS_CAMPANHA[status] ?? status;
}

const ROTULOS_EXPIRACAO_RESERVA: Record<number, string> = {
  5: '5 minutos',
  10: '10 minutos',
  30: '30 minutos',
  60: '1 hora',
  120: '2 horas',
};

export function formatarExpiracaoReserva(minutos: number | null): string {
  if (minutos === null) return 'Sem expiração automática';
  return ROTULOS_EXPIRACAO_RESERVA[minutos] ?? `${minutos} minutos`;
}

export function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara de RG no padrão 00.000.000-0: 8 dígitos + dígito verificador, que
 * pode ser "X" (só vale na última posição, depois dos 8 dígitos).
 */
export function formatarRg(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 9);
  const terminaEmX = digitos.length === 8 && /x\s*$/i.test(valor);
  const caracteres = terminaEmX ? `${digitos}X` : digitos;

  const [a, b, c, d] = [
    caracteres.slice(0, 2),
    caracteres.slice(2, 5),
    caracteres.slice(5, 8),
    caracteres.slice(8, 9),
  ];
  return a + (b ? `.${b}` : '') + (c ? `.${c}` : '') + (d ? `-${d}` : '');
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);
  return digitos
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Máscara progressiva de UUID (8-4-4-4-12) para a chave Pix aleatória (EVP). */
export function formatarChaveAleatoria(valor: string): string {
  const hex = valor.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 32);
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)]
    .filter(Boolean)
    .join('-');
}

/** Roteia para a máscara certa conforme o tipo de chave Pix escolhido; e-mail fica em texto livre. */
export function formatarChavePix(tipo: string, valor: string): string {
  switch (tipo) {
    case 'CPF':
      return formatarCpf(valor);
    case 'CNPJ':
      return formatarCnpj(valor);
    case 'CELULAR':
      return formatarTelefone(valor);
    case 'ALEATORIA':
      return formatarChaveAleatoria(valor);
    default:
      return valor;
  }
}

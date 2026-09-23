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

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

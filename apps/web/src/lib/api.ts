const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const texto = await response.text();
  const dados = texto ? JSON.parse(texto) : null;

  if (!response.ok) {
    const mensagem = Array.isArray(dados?.message)
      ? dados.message.join(' ')
      : (dados?.message ?? 'Não foi possível completar a solicitação.');
    throw new ApiError(mensagem, response.status);
  }

  return dados as T;
}

// ---------- Tipos ----------

export interface LoginOutput {
  token: string;
}

export interface AdministradorLoginOutput extends LoginOutput {
  administradorId: string;
  nome: string;
  emailConfirmado: boolean;
}

export interface CompradorLoginOutput extends LoginOutput {
  compradorId: string;
  nome: string;
}

export interface ContaAdministrador {
  nome: string;
  email: string;
  emailConfirmado: boolean;
  criadoEm: string;
}

export interface SorteioResumoDashboard {
  sorteioId: string;
  status: string;
  percentualVendido: number;
  encerrandoEm24h: boolean;
  aguardandoResultado: boolean;
}

export interface VisaoGeralDashboard {
  temSorteios: boolean;
  sorteios: SorteioResumoDashboard[];
}

export interface Grupo {
  id: string;
  administradorId: string;
  nome: string;
  identificadorWhatsapp: string;
  criadoEm: string;
}

export interface DetalheGrupo {
  id: string;
  nome: string;
  identificadorWhatsapp: string;
  criadoEm: string;
  agenteChatbot: {
    ativo: boolean;
    avisaCotasRestantes: boolean;
    avisaNovoSorteio: boolean;
    avisaResultado: boolean;
  } | null;
}

export interface CompradorResumo {
  id: string;
  nome: string;
  telefone: string;
}

export interface ContagemSorteios {
  finalizados: number;
  emAndamento: number;
}

export interface Premio {
  id: string;
  administradorId: string;
  nome: string;
  descricao: string;
  fotoUrl: string;
  valor: number;
  valorOpcaoDinheiro: number | null;
  criadoEm: string;
}

export type StatusSorteio =
  | 'AGUARDANDO_ABERTURA'
  | 'VENDAS_ABERTAS'
  | 'VENDAS_ENCERRADAS'
  | 'COTAS_ESGOTADAS'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface Sorteio {
  id: string;
  grupoId: string;
  premioId: string;
  dataAberturaVendas: string;
  dataEncerramentoVendas: string;
  dataRealizacao: string;
  quantidadeCotas: number;
  valorCota: number;
  status: StatusSorteio;
  cotaVencedoraNumero: number | null;
  vencedorOptouPorDinheiro: boolean | null;
}

export interface DadosCartao {
  numero: string;
  validade: string;
  cvv: string;
  nomeTitular: string;
}

// ---------- Administradores ----------

export const administradoresApi = {
  cadastrar: (dados: { nome: string; email: string; senha: string }) =>
    request<{ administradorId: string }>('/administradores', { method: 'POST', body: dados }),

  login: (dados: { email: string; senha: string }) =>
    request<AdministradorLoginOutput>('/administradores/login', { method: 'POST', body: dados }),

  recuperarSenha: (email: string) =>
    request<void>('/administradores/recuperar-senha', { method: 'POST', body: { email } }),

  redefinirSenha: (dados: { token: string; novaSenha: string }) =>
    request<void>('/administradores/redefinir-senha', { method: 'POST', body: dados }),

  confirmarEmail: (token: string) =>
    request<void>('/administradores/confirmar-email', { method: 'POST', body: { token } }),

  confirmarNovoEmail: (token: string) =>
    request<void>('/administradores/confirmar-novo-email', { method: 'POST', body: { token } }),

  minhaConta: (token: string) => request<ContaAdministrador>('/administradores/me', { token }),

  atualizarNome: (token: string, nome: string) =>
    request<void>('/administradores/me/nome', { method: 'PATCH', token, body: { nome } }),

  alterarSenha: (token: string, dados: { senhaAtual: string; novaSenha: string }) =>
    request<void>('/administradores/me/senha', { method: 'PATCH', token, body: dados }),

  solicitarTrocaEmail: (token: string, novoEmail: string) =>
    request<void>('/administradores/me/email', { method: 'POST', token, body: { novoEmail } }),

  dashboard: (token: string) => request<VisaoGeralDashboard>('/administradores/dashboard', { token }),
};

// ---------- Grupos ----------

export const gruposApi = {
  cadastrar: (token: string, dados: { nome: string; identificadorWhatsapp: string }) =>
    request<{ grupoId: string }>('/grupos', { method: 'POST', token, body: dados }),

  listar: (token: string) => request<Grupo[]>('/grupos', { token }),

  buscar: (token: string, grupoId: string) => request<DetalheGrupo>(`/grupos/${grupoId}`, { token }),

  criarAgenteChatbot: (token: string, grupoId: string) =>
    request<{ agenteId: string }>(`/grupos/${grupoId}/agente-chatbot`, { method: 'POST', token }),

  configurarAvisos: (
    token: string,
    grupoId: string,
    avisos: { avisaCotasRestantes?: boolean; avisaNovoSorteio?: boolean; avisaResultado?: boolean },
  ) =>
    request<void>(`/grupos/${grupoId}/agente-chatbot/avisos`, {
      method: 'PATCH',
      token,
      body: avisos,
    }),

  desativarAgenteChatbot: (token: string, grupoId: string) =>
    request<void>(`/grupos/${grupoId}/agente-chatbot/desativar`, { method: 'POST', token }),

  listarCompradores: (token: string, grupoId: string) =>
    request<CompradorResumo[]>(`/grupos/${grupoId}/compradores`, { token }),

  contarSorteios: (token: string, grupoId: string) =>
    request<ContagemSorteios>(`/grupos/${grupoId}/sorteios/contagem`, { token }),

  gerarLinkConvite: (token: string, grupoId: string) =>
    request<{ codigo: string }>(`/grupos/${grupoId}/links-convite`, { method: 'POST', token }),

  validarCodigoConvite: (codigo: string) =>
    request<{ grupoId: string }>(`/grupos/convite/${codigo}`),

  sorteiosVisiveis: (token: string) => request<Sorteio[]>('/grupos/sorteios-visiveis', { token }),
};

// ---------- Compradores ----------

export const compradoresApi = {
  cadastrar: (dados: {
    grupoId: string;
    nome: string;
    apelido?: string;
    dataNascimento: string;
    telefone: string;
    cpf: string;
    endereco: string;
    email?: string;
    senha?: string;
    aceitouTermo: boolean;
  }) => request<{ compradorId: string }>('/compradores', { method: 'POST', body: dados }),

  login: (dados: { email: string; senha: string }) =>
    request<CompradorLoginOutput>('/compradores/login', { method: 'POST', body: dados }),

  recuperarSenha: (email: string) =>
    request<void>('/compradores/recuperar-senha', { method: 'POST', body: { email } }),

  redefinirSenha: (dados: { token: string; novaSenha: string }) =>
    request<void>('/compradores/redefinir-senha', { method: 'POST', body: dados }),

  buscarPorCpf: (cpf: string) =>
    request<{ compradorId: string; nome: string; telefone: string; endereco: string } | null>(
      `/compradores/cpf/${cpf}`,
    ),
};

// ---------- Prêmios ----------

export const premiosApi = {
  cadastrar: (
    token: string,
    dados: { nome: string; descricao: string; fotoUrl: string; valor: number; valorOpcaoDinheiro?: number },
  ) => request<{ premioId: string }>('/premios', { method: 'POST', token, body: dados }),

  listar: (token: string) => request<Premio[]>('/premios', { token }),

  editar: (
    token: string,
    premioId: string,
    dados: Partial<{ nome: string; descricao: string; fotoUrl: string; valor: number; valorOpcaoDinheiro: number }>,
  ) => request<void>(`/premios/${premioId}`, { method: 'PATCH', token, body: dados }),
};

// ---------- Sorteios / cotas ----------

export const sorteiosApi = {
  reservarCota: (token: string, sorteioId: string, numero: number) =>
    request<{ cotaId: string; reservaExpiraEm: string }>(`/sorteios/${sorteioId}/cotas/reservar`, {
      method: 'POST',
      token,
      body: { sorteioId, numero },
    }),

  cancelar: (token: string, sorteioId: string) =>
    request<{ cotasLiberadas: number; escolhasGeradas: number }>(`/sorteios/${sorteioId}/cancelamento`, {
      method: 'POST',
      token,
    }),
};

// ---------- Pagamentos ----------

export const pagamentosApi = {
  gerarCobrancaPix: (token: string, sorteioId: string, numeroCota: number) =>
    request<{ qrCode: string; codigoCopiaCola: string; valor: number; validoAte: string | null }>(
      '/pagamentos/pix',
      { method: 'POST', token, body: { sorteioId, numeroCota } },
    ),

  pagarComCartao: (token: string, sorteioId: string, numeroCota: number, dadosCartao: DadosCartao) =>
    request<{ status: 'APROVADO' | 'RECUSADO' }>('/pagamentos/cartao', {
      method: 'POST',
      token,
      body: { sorteioId, numeroCota, dadosCartao },
    }),

  pagarComCashback: (token: string, sorteioId: string, numeroCota: number) =>
    request<{ pagoIntegralmente: boolean; valorAbatido: number; valorRestante: number }>(
      '/pagamentos/cashback',
      { method: 'POST', token, body: { sorteioId, numeroCota } },
    ),
};

// ---------- Cancelamento ----------

export const cancelamentosApi = {
  escolherReembolso: (token: string, escolhaId: string) =>
    request<void>(`/cancelamentos/escolhas/${escolhaId}/reembolso`, { method: 'POST', token }),

  escolherManterCotas: (token: string, escolhaId: string) =>
    request<{ creditoId: string }>(`/cancelamentos/escolhas/${escolhaId}/manter-cotas`, {
      method: 'POST',
      token,
    }),

  resgatarCredito: (
    token: string,
    creditoId: string,
    dados: { sorteioDestinoId: string; numerosCotas: number[] },
  ) =>
    request<void>(`/cancelamentos/creditos/${creditoId}/resgatar`, {
      method: 'POST',
      token,
      body: dados,
    }),
};

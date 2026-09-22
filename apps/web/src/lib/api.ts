const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * As imagens enviadas (ex: foto de prêmio) são servidas pela API, não pelo Next — precisa do
 * domínio completo. Prêmios antigos podem ter uma URL absoluta (cadastrados antes do upload
 * direto existir), então só prefixamos caminhos relativos.
 */
export function urlArquivoApi(caminho: string): string {
  if (/^https?:\/\//.test(caminho)) {
    return caminho;
  }
  return `${API_URL}${caminho}`;
}

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

/** Como `request`, mas envia FormData (upload de arquivo) em vez de JSON. */
async function requestMultipart<T>(
  path: string,
  options: { formData: FormData; token?: string | null },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: options.formData,
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

export interface CampanhaResumoDashboard {
  campanhaId: string;
  status: string;
  percentualVendido: number;
  encerrandoEm24h: boolean;
  aguardandoResultado: boolean;
}

export interface VisaoGeralDashboard {
  temCampanhas: boolean;
  campanhas: CampanhaResumoDashboard[];
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
    avisaNovaCampanha: boolean;
    avisaResultado: boolean;
  } | null;
}

export interface CompradorResumo {
  id: string;
  nome: string;
  telefone: string;
}

export interface ContagemCampanhas {
  finalizados: number;
  emAndamento: number;
}

export interface Premio {
  id: string;
  administradorId: string;
  nome: string;
  descricao: string;
  fotoUrl: string | null;
  valor: number;
  valorOpcaoDinheiro: number | null;
  criadoEm: string;
}

export type StatusVendasCampanha =
  | 'AGUARDANDO_ABERTURA'
  | 'VENDAS_ABERTAS'
  | 'VENDAS_ENCERRADAS'
  | 'COTAS_ESGOTADAS'
  | 'FINALIZADO'
  | 'CANCELADO';

export type StatusCampanha = 'NOVO' | 'AGUARDANDO_LIBERACAO' | 'LIBERADA' | 'FINALIZADA';

export type FormaVendaCotas = 'ESCOLHA_NUMERO' | 'LOTE_FECHADO';

export const EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS = [5, 10, 30, 60, 120] as const;

export interface Campanha {
  id: string;
  administradorId: string;
  grupoId: string | null;
  nome: string;
  descricao: string;
  telefoneSuporte: string;
  fotoUrl: string | null;
  premioIds: string[];
  dataAberturaVendas: string | null;
  dataEncerramentoVendas: string | null;
  dataRealizacao: string | null;
  quantidadeCotas: number;
  valorCota: number;
  quantidadeMinimaPorCompra: number;
  quantidadeMaximaPorCompra: number | null;
  expiracaoReservaMinutos: number | null;
  reservaExigeEmail: boolean;
  reservaExigeNome: boolean;
  reservaExigeTelefone: boolean;
  reservaExigeConfirmacaoTelefone: boolean;
  formaVenda: FormaVendaCotas;
  status: StatusCampanha;
  statusVendas: StatusVendasCampanha;
  cotaVencedoraNumero: number | null;
  vencedorOptouPorDinheiro: boolean | null;
  removidaEm: string | null;
}

export type Medalha = 'OURO' | 'PRATA' | 'BRONZE';

export interface RankingItem {
  posicao: number;
  medalha: Medalha;
  compradorId: string;
  nome: string;
  quantidade: number;
}

/** Ranking de vencedores: nome/telefone são os preenchidos pelo admin/operador ao finalizar a campanha. */
export interface RankingVencedorItem extends RankingItem {
  telefone: string;
}

export interface DadosCartao {
  numero: string;
  validade: string;
  cvv: string;
  nomeTitular: string;
}

export interface AlertaAutomaticoGrupo {
  grupoId: string;
  nomeGrupo: string;
  campanhaAtivaNome: string | null;
  agenteChatbot: {
    ativo: boolean;
    avisaCotasRestantes: boolean;
    avisaNovaCampanha: boolean;
    avisaResultado: boolean;
  } | null;
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

  rankingCotasCompradas: (token: string) =>
    request<RankingItem[]>('/administradores/dashboard/ranking/cotas-compradas', { token }),

  rankingVencedores: (token: string) =>
    request<RankingVencedorItem[]>('/administradores/dashboard/ranking/vencedores', { token }),
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
    avisos: { avisaCotasRestantes?: boolean; avisaNovaCampanha?: boolean; avisaResultado?: boolean },
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

  contarCampanhas: (token: string, grupoId: string) =>
    request<ContagemCampanhas>(`/grupos/${grupoId}/campanhas/contagem`, { token }),

  listarCampanhasDoGrupo: (token: string, grupoId: string) =>
    request<Campanha[]>(`/grupos/${grupoId}/campanhas`, { token }),

  lancarCampanha: (
    token: string,
    grupoId: string,
    campanhaId: string,
    dados: { dataAberturaVendas: string; dataEncerramentoVendas?: string; dataRealizacao?: string },
  ) =>
    request<{ campanhaId: string }>(`/grupos/${grupoId}/campanhas/${campanhaId}/lancar`, {
      method: 'POST',
      token,
      body: dados,
    }),

  rankingCotasCompradas: (token: string, grupoId: string) =>
    request<RankingItem[]>(`/grupos/${grupoId}/ranking/cotas-compradas`, { token }),

  rankingVencedores: (token: string, grupoId: string) =>
    request<RankingVencedorItem[]>(`/grupos/${grupoId}/ranking/vencedores`, { token }),

  gerarLinkConvite: (token: string, grupoId: string) =>
    request<{ codigo: string }>(`/grupos/${grupoId}/links-convite`, { method: 'POST', token }),

  validarCodigoConvite: (codigo: string) =>
    request<{ grupoId: string }>(`/grupos/convite/${codigo}`),

  listarAlertasAutomaticos: (token: string) =>
    request<AlertaAutomaticoGrupo[]>('/grupos/alertas-automaticos', { token }),
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
    dados: { nome: string; descricao: string; valor: number; valorOpcaoDinheiro?: number },
  ) => request<{ premioId: string }>('/premios', { method: 'POST', token, body: dados }),

  listar: (token: string) => request<Premio[]>('/premios', { token }),

  editar: (
    token: string,
    premioId: string,
    dados: Partial<{ nome: string; descricao: string; valor: number; valorOpcaoDinheiro: number }>,
  ) => request<void>(`/premios/${premioId}`, { method: 'PATCH', token, body: dados }),

  enviarFoto: (token: string, premioId: string, arquivo: File) => {
    const formData = new FormData();
    formData.append('foto', arquivo);
    return requestMultipart<{ fotoUrl: string }>(`/premios/${premioId}/foto`, { token, formData });
  },

  excluir: (token: string, premioId: string) =>
    request<void>(`/premios/${premioId}`, { method: 'DELETE', token }),
};

// ---------- Campanhas / cotas ----------

export type StatusCota = 'DISPONIVEL' | 'RESERVADA' | 'PAGA' | 'CANCELADA_REEMBOLSADA';

export interface CotaResumo {
  numero: number;
  status: StatusCota;
  minhaCota: boolean;
}

/** Visão administrativa da cota: ao contrário de `CotaResumo` (do comprador), expõe quem é o dono. */
export interface CotaAdminResumo {
  numero: number;
  status: StatusCota;
  compradorId: string | null;
  compradorNome: string | null;
  compradorTelefone: string | null;
}

export interface DadosFormularioCampanha {
  nome: string;
  descricao: string;
  telefoneSuporte: string;
  premioIds: string[];
  quantidadeCotas: number;
  valorCota: number;
  formaVenda: FormaVendaCotas;
  quantidadeMinimaPorCompra?: number;
  quantidadeMaximaPorCompra?: number | null;
  expiracaoReservaMinutos?: number | null;
  reservaExigeEmail?: boolean;
  reservaExigeNome?: boolean;
  reservaExigeTelefone?: boolean;
  reservaExigeConfirmacaoTelefone?: boolean;
}

export const campanhasApi = {
  criar: (token: string, dados: DadosFormularioCampanha) =>
    request<{ campanhaId: string }>('/campanhas', { method: 'POST', token, body: dados }),

  editar: (token: string, campanhaId: string, dados: DadosFormularioCampanha) =>
    request<void>(`/campanhas/${campanhaId}`, { method: 'PATCH', token, body: dados }),

  listar: (token: string) => request<Campanha[]>('/campanhas', { token }),

  buscar: (token: string, campanhaId: string) => request<Campanha>(`/campanhas/${campanhaId}`, { token }),

  marcarComoRevisada: (token: string, campanhaId: string) =>
    request<void>(`/campanhas/${campanhaId}/marcar-revisada`, { method: 'POST', token }),

  finalizar: (
    token: string,
    campanhaId: string,
    dados: { cotaVencedoraNumero: number; vencedorNome: string; vencedorTelefone: string },
  ) =>
    request<{ campanhaId: string; compradorVencedorId: string }>(
      `/campanhas/${campanhaId}/finalizar`,
      { method: 'POST', token, body: dados },
    ),

  remover: (token: string, campanhaId: string) =>
    request<void>(`/campanhas/${campanhaId}/remover`, { method: 'POST', token }),

  restaurar: (token: string, campanhaId: string) =>
    request<void>(`/campanhas/${campanhaId}/restaurar`, { method: 'POST', token }),

  listarCotas: (token: string, campanhaId: string) =>
    request<CotaResumo[]>(`/campanhas/${campanhaId}/cotas`, { token }),

  listarCotasAdmin: (token: string, campanhaId: string) =>
    request<CotaAdminResumo[]>(`/campanhas/${campanhaId}/cotas/admin`, { token }),

  confirmarPagamentoManual: (token: string, campanhaId: string, compradorId: string) =>
    request<void>(`/campanhas/${campanhaId}/cotas/confirmar-pagamento`, {
      method: 'POST',
      token,
      body: { compradorId },
    }),

  liberarCotasReservadas: (token: string, campanhaId: string, compradorId: string) =>
    request<void>(`/campanhas/${campanhaId}/cotas/liberar`, {
      method: 'POST',
      token,
      body: { compradorId },
    }),

  reservarCota: (token: string, campanhaId: string, numero: number) =>
    request<{ cotaId: string; reservaExpiraEm: string }>(`/campanhas/${campanhaId}/cotas/reservar`, {
      method: 'POST',
      token,
      body: { numero },
    }),

  reservarLote: (
    token: string,
    campanhaId: string,
    escolha: { numeros: number[] } | { quantidadeAleatoria: number },
  ) =>
    request<{ numeros: number[]; reservaExpiraEm: string | null }>(`/campanhas/${campanhaId}/cotas/reservar-lote`, {
      method: 'POST',
      token,
      body: escolha,
    }),

  cancelar: (token: string, campanhaId: string) =>
    request<{ cotasLiberadas: number; escolhasGeradas: number }>(`/campanhas/${campanhaId}/cancelamento`, {
      method: 'POST',
      token,
    }),

  visiveis: (token: string) => request<Campanha[]>('/campanhas/visiveis', { token }),

  enviarFoto: (token: string, campanhaId: string, arquivo: File) => {
    const formData = new FormData();
    formData.append('foto', arquivo);
    return requestMultipart<{ fotoUrl: string }>(`/campanhas/${campanhaId}/foto`, { token, formData });
  },
};

// ---------- Pagamentos ----------

export const pagamentosApi = {
  // Cobre TODAS as cotas reservadas informadas numa única cobrança/transação — não é
  // possível pagar só uma parte de um lote reservado (ver regra de negócio no backend).
  gerarCobrancaPix: (token: string, campanhaId: string, numerosCotas: number[]) =>
    request<{ qrCode: string; codigoCopiaCola: string; valor: number; validoAte: string | null }>(
      '/pagamentos/pix',
      { method: 'POST', token, body: { campanhaId, numerosCotas } },
    ),

  pagarComCartao: (token: string, campanhaId: string, numerosCotas: number[], dadosCartao: DadosCartao) =>
    request<{ status: 'APROVADO' | 'RECUSADO' }>('/pagamentos/cartao', {
      method: 'POST',
      token,
      body: { campanhaId, numerosCotas, dadosCartao },
    }),

  pagarComCashback: (token: string, campanhaId: string, numerosCotas: number[]) =>
    request<{ pagoIntegralmente: boolean; valorAbatido: number; valorRestante: number }>(
      '/pagamentos/cashback',
      { method: 'POST', token, body: { campanhaId, numerosCotas } },
    ),
};

// ---------- Administradores membros (equipe com permissões por seção) ----------

export type RecursoMenuAdmin =
  | 'CAMPANHAS'
  | 'GRUPOS'
  | 'PREMIOS'
  | 'OPERADORES'
  | 'ALERTAS_AUTOMATICOS'
  | 'ADMINISTRADORES';

export interface PermissaoRecurso {
  recurso: RecursoMenuAdmin;
  podeCriar: boolean;
  podeEditar: boolean;
  podeRemover: boolean;
}

export interface AdministradorMembro {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  rg: string | null;
  permissoes: PermissaoRecurso[];
  criadoEm: string;
}

export const administradoresMembrosApi = {
  cadastrar: (
    token: string,
    dados: {
      nome: string;
      email: string;
      telefone: string;
      cpf: string;
      rg: string;
      senha: string;
      permissoes: PermissaoRecurso[];
    },
  ) => request<{ membroId: string }>('/administradores/membros', { method: 'POST', token, body: dados }),

  listar: (token: string) => request<AdministradorMembro[]>('/administradores/membros', { token }),

  buscar: (token: string, membroId: string) =>
    request<AdministradorMembro>(`/administradores/membros/${membroId}`, { token }),

  editar: (
    token: string,
    membroId: string,
    dados: Partial<{
      nome: string;
      email: string;
      telefone: string;
      rg: string;
      permissoes: PermissaoRecurso[];
    }>,
  ) => request<void>(`/administradores/membros/${membroId}`, { method: 'PATCH', token, body: dados }),

  excluir: (token: string, membroId: string) =>
    request<void>(`/administradores/membros/${membroId}`, { method: 'DELETE', token }),
};

// ---------- Operadores ----------

export type RecursoMenuOperador = 'CAMPANHAS' | 'GRUPOS' | 'PREMIOS' | 'ALERTAS_AUTOMATICOS';

export interface PermissaoRecursoOperador {
  recurso: RecursoMenuOperador;
  podeCriar: boolean;
  podeEditar: boolean;
  podeRemover: boolean;
}

export interface Operador {
  id: string;
  nomeCompleto: string;
  endereco: string;
  cpf: string;
  rg: string;
  telefone: string;
  login: string;
  grupoIds: string[];
  permissoes: PermissaoRecursoOperador[];
  criadoEm: string;
}

export const operadoresApi = {
  cadastrar: (
    token: string,
    dados: {
      nomeCompleto: string;
      endereco: string;
      cpf: string;
      rg: string;
      telefone: string;
      login: string;
      senha: string;
      grupoIds: string[];
      permissoes: PermissaoRecursoOperador[];
    },
  ) => request<{ operadorId: string }>('/operadores', { method: 'POST', token, body: dados }),

  listar: (token: string) => request<Operador[]>('/operadores', { token }),

  buscar: (token: string, operadorId: string) => request<Operador>(`/operadores/${operadorId}`, { token }),

  editar: (
    token: string,
    operadorId: string,
    dados: Partial<{
      nomeCompleto: string;
      endereco: string;
      rg: string;
      telefone: string;
      login: string;
      senha: string;
      grupoIds: string[];
      permissoes: PermissaoRecursoOperador[];
    }>,
  ) => request<void>(`/operadores/${operadorId}`, { method: 'PATCH', token, body: dados }),

  excluir: (token: string, operadorId: string) =>
    request<void>(`/operadores/${operadorId}`, { method: 'DELETE', token }),
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
    dados: { campanhaDestinoId: string; numerosCotas: number[] },
  ) =>
    request<void>(`/cancelamentos/creditos/${creditoId}/resgatar`, {
      method: 'POST',
      token,
      body: dados,
    }),
};

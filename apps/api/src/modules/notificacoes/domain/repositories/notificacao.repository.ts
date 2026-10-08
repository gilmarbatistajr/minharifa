import { Notificacao, TipoNotificacao } from '../entities/notificacao.entity';

/** Quem é o operador do ponto de vista das notificações: de qual administrador e quais grupos. */
export interface EscopoOperador {
  administradorId: string;
  grupoIds: string[];
}

export interface FiltroNotificacoes {
  administradorId: string;
  /** Quando informado, só devolve notificações desses grupos (escopo de operador). */
  grupoIds?: string[];
}

export interface NotificacaoRepository {
  criar(notificacao: Notificacao): Promise<void>;
  buscarPorId(id: string): Promise<Notificacao | null>;
  salvar(notificacao: Notificacao): Promise<void>;
  listar(filtro: FiltroNotificacoes, limite: number): Promise<Notificacao[]>;
  contarNaoLidas(filtro: FiltroNotificacoes): Promise<number>;
  marcarTodasComoLidas(filtro: FiltroNotificacoes, agora: Date): Promise<void>;
  existePorCampanhaETipo(campanhaId: string, tipo: TipoNotificacao): Promise<boolean>;
  buscarEscopoDoOperador(operadorId: string): Promise<EscopoOperador | null>;
}

export const NOTIFICACAO_REPOSITORY = Symbol('NOTIFICACAO_REPOSITORY');

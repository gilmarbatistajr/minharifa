import { Notificacao, TipoNotificacao } from '../domain/entities/notificacao.entity';
import {
  EscopoOperador,
  FiltroNotificacoes,
  NotificacaoRepository,
} from '../domain/repositories/notificacao.repository';

/** Implementação em memória só para os testes unitários dos casos de uso. */
export class RepositorioDeNotificacoesEmMemoria implements NotificacaoRepository {
  readonly notificacoes: Notificacao[] = [];

  constructor(private readonly operadores: Record<string, EscopoOperador> = {}) {}

  private visiveis(filtro: FiltroNotificacoes): Notificacao[] {
    return this.notificacoes.filter(
      (n) =>
        n.administradorId === filtro.administradorId &&
        (!filtro.grupoIds || (n.grupoId !== null && filtro.grupoIds.includes(n.grupoId))),
    );
  }

  async criar(notificacao: Notificacao): Promise<void> {
    this.notificacoes.push(notificacao);
  }

  async buscarPorId(id: string): Promise<Notificacao | null> {
    return this.notificacoes.find((n) => n.id === id) ?? null;
  }

  async salvar(): Promise<void> {
    // objetos já são mantidos por referência
  }

  async listar(filtro: FiltroNotificacoes, limite: number): Promise<Notificacao[]> {
    return this.visiveis(filtro)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }

  async contarNaoLidas(filtro: FiltroNotificacoes): Promise<number> {
    return this.visiveis(filtro).filter((n) => !n.estaLida()).length;
  }

  async marcarTodasComoLidas(filtro: FiltroNotificacoes, agora: Date): Promise<void> {
    this.visiveis(filtro).forEach((n) => n.marcarComoLida(agora));
  }

  async existePorCampanhaETipo(campanhaId: string, tipo: TipoNotificacao): Promise<boolean> {
    return this.notificacoes.some((n) => n.campanhaId === campanhaId && n.tipo === tipo);
  }

  async buscarEscopoDoOperador(operadorId: string): Promise<EscopoOperador | null> {
    return this.operadores[operadorId] ?? null;
  }
}

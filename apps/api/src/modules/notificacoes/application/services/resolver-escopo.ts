import { FiltroNotificacoes, NotificacaoRepository } from '../../domain/repositories/notificacao.repository';

export interface QuemConsulta {
  administradorId?: string;
  operadorId?: string;
}

/**
 * Traduz quem está consultando para o filtro de notificações: o administrador
 * vê todas as da conta dele; o operador, só as dos grupos a que tem acesso.
 */
export async function resolverEscopo(
  notificacaoRepository: NotificacaoRepository,
  quem: QuemConsulta,
): Promise<FiltroNotificacoes> {
  if (quem.administradorId) {
    return { administradorId: quem.administradorId };
  }

  if (quem.operadorId) {
    const escopo = await notificacaoRepository.buscarEscopoDoOperador(quem.operadorId);
    if (escopo) {
      return { administradorId: escopo.administradorId, grupoIds: escopo.grupoIds };
    }
  }

  throw new Error('Usuário sem acesso às notificações.');
}

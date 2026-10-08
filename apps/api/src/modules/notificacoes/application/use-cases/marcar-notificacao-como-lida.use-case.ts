import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICACAO_REPOSITORY, NotificacaoRepository } from '../../domain/repositories/notificacao.repository';
import { QuemConsulta, resolverEscopo } from '../services/resolver-escopo';

export interface MarcarNotificacaoComoLidaInput extends QuemConsulta {
  notificacaoId: string;
}

@Injectable()
export class MarcarNotificacaoComoLidaUseCase {
  constructor(
    @Inject(NOTIFICACAO_REPOSITORY)
    private readonly notificacaoRepository: NotificacaoRepository,
  ) {}

  async executar(input: MarcarNotificacaoComoLidaInput, agora: Date = new Date()): Promise<void> {
    const filtro = await resolverEscopo(this.notificacaoRepository, input);
    const notificacao = await this.notificacaoRepository.buscarPorId(input.notificacaoId);

    const visivel =
      notificacao &&
      notificacao.administradorId === filtro.administradorId &&
      (!filtro.grupoIds || (notificacao.grupoId !== null && filtro.grupoIds.includes(notificacao.grupoId)));
    if (!notificacao || !visivel) {
      throw new Error('Notificação não encontrada.');
    }

    notificacao.marcarComoLida(agora);
    await this.notificacaoRepository.salvar(notificacao);
  }
}

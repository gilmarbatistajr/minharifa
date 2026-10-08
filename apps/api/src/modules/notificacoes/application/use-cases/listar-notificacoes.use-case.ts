import { Inject, Injectable } from '@nestjs/common';
import { Notificacao } from '../../domain/entities/notificacao.entity';
import { NOTIFICACAO_REPOSITORY, NotificacaoRepository } from '../../domain/repositories/notificacao.repository';
import { QuemConsulta, resolverEscopo } from '../services/resolver-escopo';

export interface ListarNotificacoesInput extends QuemConsulta {
  limite?: number;
}

export interface ListarNotificacoesOutput {
  notificacoes: Notificacao[];
  naoLidas: number;
}

const LIMITE_PADRAO = 100;

/** Menu "Notificações": mais recentes primeiro, com o total de não lidas (para o contador do menu). */
@Injectable()
export class ListarNotificacoesUseCase {
  constructor(
    @Inject(NOTIFICACAO_REPOSITORY)
    private readonly notificacaoRepository: NotificacaoRepository,
  ) {}

  async executar(input: ListarNotificacoesInput): Promise<ListarNotificacoesOutput> {
    const filtro = await resolverEscopo(this.notificacaoRepository, input);
    const [notificacoes, naoLidas] = await Promise.all([
      this.notificacaoRepository.listar(filtro, input.limite ?? LIMITE_PADRAO),
      this.notificacaoRepository.contarNaoLidas(filtro),
    ]);

    return { notificacoes, naoLidas };
  }
}

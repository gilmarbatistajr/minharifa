import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICACAO_REPOSITORY, NotificacaoRepository } from '../../domain/repositories/notificacao.repository';
import { QuemConsulta, resolverEscopo } from '../services/resolver-escopo';

@Injectable()
export class MarcarTodasNotificacoesComoLidasUseCase {
  constructor(
    @Inject(NOTIFICACAO_REPOSITORY)
    private readonly notificacaoRepository: NotificacaoRepository,
  ) {}

  async executar(input: QuemConsulta, agora: Date = new Date()): Promise<void> {
    const filtro = await resolverEscopo(this.notificacaoRepository, input);
    await this.notificacaoRepository.marcarTodasComoLidas(filtro, agora);
  }
}

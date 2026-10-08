import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Notificacao } from '../../domain/entities/notificacao.entity';
import { NOTIFICACAO_REPOSITORY, NotificacaoRepository } from '../../domain/repositories/notificacao.repository';

export interface RegistrarNovaVendaInput {
  administradorId: string;
  campanhaId: string;
  grupoId: string | null;
  nomeCampanha: string;
}

/** Gatilho: o jogador finalizou a compra de cotas — o organizador precisa confirmar o pagamento. */
@Injectable()
export class RegistrarNovaVendaUseCase {
  constructor(
    @Inject(NOTIFICACAO_REPOSITORY)
    private readonly notificacaoRepository: NotificacaoRepository,
  ) {}

  async executar(input: RegistrarNovaVendaInput, agora: Date = new Date()): Promise<void> {
    await this.notificacaoRepository.criar(
      new Notificacao(
        randomUUID(),
        input.administradorId,
        input.campanhaId,
        input.grupoId,
        'NOVA_VENDA',
        Notificacao.mensagemNovaVenda(input.nomeCampanha),
        null,
        agora,
      ),
    );
  }
}

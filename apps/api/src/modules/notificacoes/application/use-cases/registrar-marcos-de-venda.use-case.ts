import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MARCOS_COTAS_VENDIDAS, Notificacao, tipoDoMarco } from '../../domain/entities/notificacao.entity';
import { NOTIFICACAO_REPOSITORY, NotificacaoRepository } from '../../domain/repositories/notificacao.repository';

export interface RegistrarMarcosDeVendaInput {
  administradorId: string;
  campanhaId: string;
  grupoId: string | null;
  nomeCampanha: string;
  /** Percentual de cotas pagas (0–100) no momento. */
  percentualVendido: number;
}

/**
 * Gatilho: depois de um pagamento confirmado, cria uma notificação para cada
 * marco de cotas vendidas (20/50/75/90/100%) já atingido que ainda não foi
 * avisado — uma única vez por campanha por marco. Se um pagamento fizer a
 * campanha pular vários marcos de uma vez, todos são avisados.
 */
@Injectable()
export class RegistrarMarcosDeVendaUseCase {
  constructor(
    @Inject(NOTIFICACAO_REPOSITORY)
    private readonly notificacaoRepository: NotificacaoRepository,
  ) {}

  async executar(input: RegistrarMarcosDeVendaInput, agora: Date = new Date()): Promise<void> {
    for (const marco of MARCOS_COTAS_VENDIDAS) {
      if (input.percentualVendido < marco) {
        continue;
      }

      const tipo = tipoDoMarco(marco);
      if (await this.notificacaoRepository.existePorCampanhaETipo(input.campanhaId, tipo)) {
        continue;
      }

      await this.notificacaoRepository.criar(
        new Notificacao(
          randomUUID(),
          input.administradorId,
          input.campanhaId,
          input.grupoId,
          tipo,
          Notificacao.mensagemMarco(marco, input.nomeCampanha),
          null,
          agora,
        ),
      );
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  CREDITO_PENDENTE_REPOSITORY,
  CreditoPendenteRepository,
} from '../../domain/repositories/credito-pendente.repository';
import { atualizarStatusCampanhaAposPagamento } from '../../../campanhas/application/services/atualizar-status-apos-pagamento';
import { dispararAlertasCotasVendidas } from '../../../campanhas/application/services/disparar-alertas-cotas-vendidas';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../../grupos/domain/repositories/agente-chatbot.repository';
import { NOTIFICATION_SENDER, NotificationSender } from '../../../../shared/domain/notification-sender';

export interface ResgatarCreditoInput {
  creditoId: string;
  compradorId: string;
  campanhaDestinoId: string;
  numerosCotas: number[];
}

/**
 * Cobre cancelamento-de-sorteio.feature: "...ela pode escolher os números
 * dessas cotas dentro das disponíveis nessa nova campanha" — o resgate do
 * crédito gerado por EscolherManterCotasUseCase.
 */
@Injectable()
export class ResgatarCreditoUseCase {
  constructor(
    @Inject(CREDITO_PENDENTE_REPOSITORY)
    private readonly creditoPendenteRepository: CreditoPendenteRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(input: ResgatarCreditoInput, agora: Date = new Date()): Promise<void> {
    const credito = await this.creditoPendenteRepository.buscarPorId(input.creditoId);

    if (!credito || credito.compradorId !== input.compradorId) {
      throw new Error('Crédito não encontrado.');
    }

    if (credito.utilizado) {
      throw new Error('Este crédito já foi utilizado.');
    }

    if (input.numerosCotas.length !== credito.quantidadeCotas) {
      throw new Error('A quantidade de números escolhidos deve ser igual à quantidade de cotas do crédito.');
    }

    const campanhaDestino = await this.campanhaRepository.buscarPorId(input.campanhaDestinoId);
    if (!campanhaDestino || campanhaDestino.grupoId !== credito.grupoId) {
      throw new Error('Este crédito não pode ser resgatado nessa campanha.');
    }

    for (const numero of input.numerosCotas) {
      const cota = await this.cotaRepository.buscarPorCampanhaENumero(input.campanhaDestinoId, numero);

      if (!cota) {
        throw new Error(`Cota ${numero} não existe nessa campanha.`);
      }

      cota.pagarComCredito(input.compradorId, agora);
      await this.cotaRepository.salvar(cota);
    }

    credito.marcarComoUtilizado();
    await this.creditoPendenteRepository.salvar(credito);

    await atualizarStatusCampanhaAposPagamento(this.campanhaRepository, this.cotaRepository, campanhaDestino);
    await dispararAlertasCotasVendidas(
      this.campanhaRepository,
      this.cotaRepository,
      this.grupoRepository,
      this.agenteChatbotRepository,
      this.notificationSender,
      campanhaDestino,
    );
  }
}

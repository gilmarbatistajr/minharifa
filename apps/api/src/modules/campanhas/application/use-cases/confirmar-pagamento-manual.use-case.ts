import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { atualizarStatusCampanhaAposPagamento } from '../services/atualizar-status-apos-pagamento';
import { dispararAlertasCotasVendidas } from '../services/disparar-alertas-cotas-vendidas';
import { RegistrarMarcosDeVendaUseCase } from '../../../notificacoes/application/use-cases/registrar-marcos-de-venda.use-case';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../../grupos/domain/repositories/agente-chatbot.repository';
import { NOTIFICATION_SENDER, NotificationSender } from '../../../../shared/domain/notification-sender';

export interface ConfirmarPagamentoManualInput {
  administradorId: string;
  campanhaId: string;
  compradorId?: string;
  tokenReservaConvidado?: string;
}

/**
 * Cobre a confirmação manual de pagamento pelo administrador (ex.: recebeu
 * por fora do gateway, num Pix direto ou em dinheiro). Confirma TODAS as
 * cotas RESERVADA do comprador na campanha de uma vez — mesma regra de
 * "sem pagamento parcial de um lote reservado" que vale para os pagamentos
 * automáticos (ver `resolverCotasElegiveisParaPagamento`).
 */
@Injectable()
export class ConfirmarPagamentoManualUseCase {
  constructor(
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
    private readonly registrarMarcosDeVenda: RegistrarMarcosDeVendaUseCase,
  ) {}

  async executar(input: ConfirmarPagamentoManualInput): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotasReservadas = input.compradorId
      ? await this.cotaRepository.listarReservadasPorComprador(input.campanhaId, input.compradorId)
      : await this.cotaRepository.listarReservadasPorTokenConvidado(
          input.campanhaId,
          input.tokenReservaConvidado!,
        );

    if (cotasReservadas.length === 0) {
      throw new Error('Este comprador não tem cotas reservadas nesta campanha.');
    }

    for (const cota of cotasReservadas) {
      cota.confirmarPagamento();
      await this.cotaRepository.salvar(cota);
    }

    await atualizarStatusCampanhaAposPagamento(this.campanhaRepository, this.cotaRepository, campanha);
    await dispararAlertasCotasVendidas(
      this.campanhaRepository,
      this.cotaRepository,
      this.grupoRepository,
      this.agenteChatbotRepository,
      this.notificationSender,
      campanha,
    this.registrarMarcosDeVenda,
    );
  }
}

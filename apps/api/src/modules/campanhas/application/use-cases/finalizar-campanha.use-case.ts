import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../../operadores/domain/repositories/operador.repository';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../../grupos/domain/repositories/agente-chatbot.repository';
import { NOTIFICATION_SENDER, NotificationSender } from '../../../../shared/domain/notification-sender';
import { notificarGrupo } from '../services/notificar-grupo';

export interface FinalizarCampanhaInput {
  /** Informado quando quem finaliza é o próprio administrador dono da conta. */
  administradorId?: string;
  /** Informado quando quem finaliza é um operador — o administrador dono é resolvido a partir dele. */
  operadorId?: string;
  campanhaId: string;
  cotaVencedoraNumero: number;
  vencedorNome: string;
  vencedorTelefone: string;
}

export interface FinalizarCampanhaOutput {
  campanhaId: string;
  compradorVencedorId: string;
}

/**
 * Permite ao administrador ou a um operador com permissão de edição em
 * campanhas registrar o vencedor de uma campanha já realizada, informando o
 * número da cota vencedora. Alimenta o ranking de vencedores.
 */
@Injectable()
export class FinalizarCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(input: FinalizarCampanhaInput): Promise<FinalizarCampanhaOutput> {
    const administradorId = await this.resolverAdministradorId(input);

    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotaVencedora = await this.cotaRepository.buscarPorCampanhaENumero(
      input.campanhaId,
      input.cotaVencedoraNumero,
    );
    if (!cotaVencedora || cotaVencedora.status !== 'PAGA' || !cotaVencedora.compradorId) {
      throw new Error('A cota vencedora precisa ser uma cota paga por um comprador.');
    }

    campanha.finalizar({
      cotaVencedoraNumero: input.cotaVencedoraNumero,
      vencedorNome: input.vencedorNome,
      vencedorTelefone: input.vencedorTelefone,
    });
    await this.campanhaRepository.salvar(campanha);

    if (campanha.grupoId) {
      const agente = await this.agenteChatbotRepository.buscarPorGrupoId(campanha.grupoId);
      if (agente?.ativo && agente.avisaResultado && agente.mensagemResultado) {
        await notificarGrupo(this.grupoRepository, this.notificationSender, campanha.grupoId, agente.mensagemResultado);
      }
    }

    return { campanhaId: campanha.id, compradorVencedorId: cotaVencedora.compradorId };
  }

  private async resolverAdministradorId(input: FinalizarCampanhaInput): Promise<string> {
    if (input.operadorId) {
      const operador = await this.operadorRepository.buscarPorId(input.operadorId);
      if (!operador) {
        throw new Error('Operador não encontrado.');
      }
      if (!operador.podeEditarRecurso('CAMPANHAS')) {
        throw new Error('Você não tem permissão para finalizar campanhas.');
      }
      return operador.administradorId;
    }

    if (!input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }
    return input.administradorId;
  }
}

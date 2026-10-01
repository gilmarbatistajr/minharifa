import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { notificarGrupo } from '../../../campanhas/application/services/notificar-grupo';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';
import { NOTIFICATION_SENDER, NotificationSender } from '../../../../shared/domain/notification-sender';

export interface LancarCampanhaInput {
  administradorId: string;
  grupoId: string;
  campanhaId: string;
  dataAberturaVendas: Date;
  dataEncerramentoVendas: Date | null;
  dataRealizacao: Date | null;
}

export interface LancarCampanhaOutput {
  campanhaId: string;
}

/**
 * Cobre o lançamento de uma campanha já revisada: vincula-a a um grupo,
 * define as datas de venda e materializa as cotas (1..quantidadeCotas) —
 * até aqui não havia nada para reservar/pagar.
 */
@Injectable()
export class LancarCampanhaUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(input: LancarCampanhaInput): Promise<LancarCampanhaOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    campanha.lancar(
      input.grupoId,
      input.dataAberturaVendas,
      input.dataEncerramentoVendas,
      input.dataRealizacao,
    );
    await this.campanhaRepository.salvar(campanha);

    const cotas = Array.from(
      { length: campanha.quantidadeCotas },
      (_, indice) => new Cota(randomUUID(), campanha.id, indice + 1, 'DISPONIVEL', null, null, null),
    );
    await this.cotaRepository.criarEmLote(cotas);

    // Duas mensagens quando o aviso de nova campanha está ligado: primeiro o
    // texto configurado em Alertas automáticos (se houver), depois a própria
    // descrição da campanha — é ela que carrega os dados reais (prêmios,
    // valor, link de vendas) que o comprador precisa pra decidir comprar.
    const agente = await this.agenteChatbotRepository.buscarPorGrupoId(input.grupoId);
    if (agente?.ativo && agente.avisaNovaCampanha) {
      if (agente.mensagemNovaCampanha) {
        await notificarGrupo(
          this.grupoRepository,
          this.notificationSender,
          input.grupoId,
          agente.mensagemNovaCampanha,
        );
      }
      await notificarGrupo(this.grupoRepository, this.notificationSender, input.grupoId, campanha.descricao);
    }

    return { campanhaId: campanha.id };
  }
}

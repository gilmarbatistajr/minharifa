import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import { AgenteChatbot } from '../../domain/entities/agente-chatbot.entity';

export interface CriarAgenteChatbotInput {
  administradorId: string;
  grupoId: string;
}

export interface CriarAgenteChatbotOutput {
  agenteId: string;
}

/** Cobre meus-grupos.feature: "Adicionar agente chatbot a um grupo". */
@Injectable()
export class CriarAgenteChatbotUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
  ) {}

  async executar(input: CriarAgenteChatbotInput): Promise<CriarAgenteChatbotOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const existente = await this.agenteChatbotRepository.buscarPorGrupoId(input.grupoId);
    if (existente) {
      throw new Error('Este grupo já possui um agente chatbot.');
    }

    const agente = new AgenteChatbot(randomUUID(), input.grupoId, true, true, true, true);

    await this.agenteChatbotRepository.criar(agente);

    return { agenteId: agente.id };
  }
}

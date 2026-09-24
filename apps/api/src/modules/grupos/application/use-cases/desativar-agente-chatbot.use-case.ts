import { Inject, Injectable } from '@nestjs/common';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';

export interface DesativarAgenteChatbotInput {
  administradorId: string;
  grupoId: string;
}

/** Cobre meus-grupos.feature: "Desativar agente chatbot". */
@Injectable()
export class DesativarAgenteChatbotUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
  ) {}

  async executar(input: DesativarAgenteChatbotInput): Promise<void> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const agente = await this.agenteChatbotRepository.buscarPorGrupoId(input.grupoId);

    if (!agente) {
      throw new Error('Este grupo não possui um agente chatbot.');
    }

    agente.desativar();

    await this.agenteChatbotRepository.salvar(agente);
  }
}

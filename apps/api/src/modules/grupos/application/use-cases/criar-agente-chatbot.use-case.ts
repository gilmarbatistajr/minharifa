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

const MENSAGEM_PADRAO_50_POR_CENTO = '50% das cotas já foram vendidas! Garanta a sua antes que acabem.';
const MENSAGEM_PADRAO_80_POR_CENTO = '80% das cotas já foram vendidas! Não fique de fora.';
const MENSAGEM_PADRAO_90_POR_CENTO = '90% das cotas já foram vendidas! Últimas chances de participar.';
const MENSAGEM_PADRAO_NOVA_CAMPANHA =
  'Uma nova campanha foi lançada! Confira as cotas disponíveis e participe.';
const MENSAGEM_PADRAO_RESULTADO =
  'O resultado da campanha saiu! Confira quem foi o grande vencedor.';

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

    const agente = new AgenteChatbot(
      randomUUID(),
      input.grupoId,
      true,
      true,
      true,
      true,
      MENSAGEM_PADRAO_50_POR_CENTO,
      MENSAGEM_PADRAO_NOVA_CAMPANHA,
      MENSAGEM_PADRAO_RESULTADO,
      true,
      true,
      MENSAGEM_PADRAO_80_POR_CENTO,
      MENSAGEM_PADRAO_90_POR_CENTO,
    );

    await this.agenteChatbotRepository.criar(agente);

    return { agenteId: agente.id };
  }
}

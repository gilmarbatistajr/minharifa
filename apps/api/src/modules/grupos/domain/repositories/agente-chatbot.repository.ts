import { AgenteChatbot } from '../entities/agente-chatbot.entity';

export interface AgenteChatbotRepository {
  buscarPorGrupoId(grupoId: string): Promise<AgenteChatbot | null>;
  criar(agente: AgenteChatbot): Promise<void>;
  salvar(agente: AgenteChatbot): Promise<void>;
}

export const AGENTE_CHATBOT_REPOSITORY = Symbol('AGENTE_CHATBOT_REPOSITORY');

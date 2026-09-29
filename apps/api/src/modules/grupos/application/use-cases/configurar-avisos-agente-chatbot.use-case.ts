import { Inject, Injectable } from '@nestjs/common';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';
import { AvisosAgenteChatbot } from '../../domain/entities/agente-chatbot.entity';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';

export interface ConfigurarAvisosAgenteChatbotInput extends AvisosAgenteChatbot {
  administradorId: string;
  grupoId: string;
}

/** Cobre meus-grupos.feature: "Configurar quais tipos de mensagem o agente envia". */
@Injectable()
export class ConfigurarAvisosAgenteChatbotUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
  ) {}

  async executar(input: ConfigurarAvisosAgenteChatbotInput): Promise<void> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const agente = await this.agenteChatbotRepository.buscarPorGrupoId(input.grupoId);

    if (!agente) {
      throw new Error('Este grupo não possui um agente chatbot.');
    }

    agente.configurarAvisos({
      avisa50PorCentoVendido: input.avisa50PorCentoVendido,
      avisa80PorCentoVendido: input.avisa80PorCentoVendido,
      avisa90PorCentoVendido: input.avisa90PorCentoVendido,
      avisaNovaCampanha: input.avisaNovaCampanha,
      avisaResultado: input.avisaResultado,
      mensagem50PorCentoVendido: input.mensagem50PorCentoVendido,
      mensagem80PorCentoVendido: input.mensagem80PorCentoVendido,
      mensagem90PorCentoVendido: input.mensagem90PorCentoVendido,
      mensagemNovaCampanha: input.mensagemNovaCampanha,
      mensagemResultado: input.mensagemResultado,
    });

    await this.agenteChatbotRepository.salvar(agente);
  }
}

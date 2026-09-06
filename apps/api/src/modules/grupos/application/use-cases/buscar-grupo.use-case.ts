import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';

export interface BuscarGrupoInput {
  administradorId: string;
  grupoId: string;
}

export interface BuscarGrupoOutput {
  id: string;
  nome: string;
  identificadorWhatsapp: string;
  criadoEm: Date;
  agenteChatbot: {
    ativo: boolean;
    avisaCotasRestantes: boolean;
    avisaNovoSorteio: boolean;
    avisaResultado: boolean;
  } | null;
}

/** Cobre meus-grupos.feature: tela de detalhes de um grupo. */
@Injectable()
export class BuscarGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
  ) {}

  async executar(input: BuscarGrupoInput): Promise<BuscarGrupoOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const agente = await this.agenteChatbotRepository.buscarPorGrupoId(input.grupoId);

    return {
      id: grupo.id,
      nome: grupo.nome,
      identificadorWhatsapp: grupo.identificadorWhatsapp,
      criadoEm: grupo.criadoEm,
      agenteChatbot: agente
        ? {
            ativo: agente.ativo,
            avisaCotasRestantes: agente.avisaCotasRestantes,
            avisaNovoSorteio: agente.avisaNovoSorteio,
            avisaResultado: agente.avisaResultado,
          }
        : null,
    };
  }
}

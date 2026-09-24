import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';
import {
  LINK_CONVITE_REPOSITORY,
  LinkConviteRepository,
} from '../../domain/repositories/link-convite.repository';

export interface BuscarGrupoInput {
  administradorId: string;
  grupoId: string;
}

export interface BuscarGrupoOutput {
  id: string;
  nome: string;
  identificadorWhatsapp: string;
  linkWhatsapp: string | null;
  criadoEm: Date;
  codigoConvite: string | null;
  agenteChatbot: {
    ativo: boolean;
    avisaCotasRestantes: boolean;
    avisaNovaCampanha: boolean;
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
    @Inject(LINK_CONVITE_REPOSITORY)
    private readonly linkConviteRepository: LinkConviteRepository,
  ) {}

  async executar(input: BuscarGrupoInput): Promise<BuscarGrupoOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const agente = await this.agenteChatbotRepository.buscarPorGrupoId(input.grupoId);
    const linkConvite = await this.linkConviteRepository.buscarAtivoPorGrupo(input.grupoId);

    return {
      id: grupo.id,
      nome: grupo.nome,
      identificadorWhatsapp: grupo.identificadorWhatsapp,
      linkWhatsapp: grupo.linkWhatsapp,
      criadoEm: grupo.criadoEm,
      codigoConvite: linkConvite?.codigo ?? null,
      agenteChatbot: agente
        ? {
            ativo: agente.ativo,
            avisaCotasRestantes: agente.avisaCotasRestantes,
            avisaNovaCampanha: agente.avisaNovaCampanha,
            avisaResultado: agente.avisaResultado,
          }
        : null,
    };
  }
}

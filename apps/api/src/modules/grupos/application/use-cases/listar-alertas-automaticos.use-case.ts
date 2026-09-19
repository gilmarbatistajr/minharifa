import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  AGENTE_CHATBOT_REPOSITORY,
  AgenteChatbotRepository,
} from '../../domain/repositories/agente-chatbot.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';

export interface ListarAlertasAutomaticosInput {
  administradorId: string;
}

export interface AlertasAutomaticosGrupo {
  grupoId: string;
  nomeGrupo: string;
  campanhaAtivaNome: string | null;
  agenteChatbot: {
    ativo: boolean;
    avisaCotasRestantes: boolean;
    avisaNovaCampanha: boolean;
    avisaResultado: boolean;
  } | null;
}

/**
 * Alimenta o menu "Alertas automáticos": centraliza, para cada grupo do
 * administrador que tem uma campanha liberada associada, os avisos
 * automáticos do agente chatbot já existentes.
 */
@Injectable()
export class ListarAlertasAutomaticosUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(AGENTE_CHATBOT_REPOSITORY)
    private readonly agenteChatbotRepository: AgenteChatbotRepository,
  ) {}

  async executar(input: ListarAlertasAutomaticosInput): Promise<AlertasAutomaticosGrupo[]> {
    const grupos = await this.grupoRepository.listarPorAdministrador(input.administradorId);

    const resultado: AlertasAutomaticosGrupo[] = [];
    for (const grupo of grupos) {
      const campanhas = await this.campanhaRepository.listarPorGrupo(grupo.id);
      const campanhaAtiva = campanhas.find((campanha) => campanha.status === 'LIBERADA');

      if (!campanhaAtiva) {
        continue;
      }

      const agente = await this.agenteChatbotRepository.buscarPorGrupoId(grupo.id);

      resultado.push({
        grupoId: grupo.id,
        nomeGrupo: grupo.nome,
        campanhaAtivaNome: campanhaAtiva.nome,
        agenteChatbot: agente
          ? {
              ativo: agente.ativo,
              avisaCotasRestantes: agente.avisaCotasRestantes,
              avisaNovaCampanha: agente.avisaNovaCampanha,
              avisaResultado: agente.avisaResultado,
            }
          : null,
      });
    }

    return resultado;
  }
}

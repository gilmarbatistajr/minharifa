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
    avisa50PorCentoVendido: boolean;
    avisa80PorCentoVendido: boolean;
    avisa90PorCentoVendido: boolean;
    avisaNovaCampanha: boolean;
    avisaResultado: boolean;
    mensagem50PorCentoVendido: string | null;
    mensagem80PorCentoVendido: string | null;
    mensagem90PorCentoVendido: string | null;
    mensagemNovaCampanha: string | null;
    mensagemResultado: string | null;
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
      const campanhaAtiva = campanhas.find(
        (campanha) => campanha.status === 'LIBERADA' || campanha.status === 'LIBERADA_PARA_SORTEIO',
      );

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
              avisa50PorCentoVendido: agente.avisa50PorCentoVendido,
              avisa80PorCentoVendido: agente.avisa80PorCentoVendido,
              avisa90PorCentoVendido: agente.avisa90PorCentoVendido,
              avisaNovaCampanha: agente.avisaNovaCampanha,
              avisaResultado: agente.avisaResultado,
              mensagem50PorCentoVendido: agente.mensagem50PorCentoVendido,
              mensagem80PorCentoVendido: agente.mensagem80PorCentoVendido,
              mensagem90PorCentoVendido: agente.mensagem90PorCentoVendido,
              mensagemNovaCampanha: agente.mensagemNovaCampanha,
              mensagemResultado: agente.mensagemResultado,
            }
          : null,
      });
    }

    return resultado;
  }
}

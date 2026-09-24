import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';

export interface ObterVisaoGeralDashboardInput {
  administradorId: string;
}

export interface CampanhaResumoDashboard {
  campanhaId: string;
  status: string;
  percentualVendido: number;
  encerrandoEm24h: boolean;
  aguardandoResultado: boolean;
}

export interface ObterVisaoGeralDashboardOutput {
  temCampanhas: boolean;
  campanhas: CampanhaResumoDashboard[];
}

const STATUS_VENDAS_ATIVOS = ['VENDAS_ABERTAS', 'COTAS_ESGOTADAS'];

/**
 * Cobre dashboard-visao-geral.feature: visão com campanhas ativas, onboarding
 * sem campanhas, atalho "encerrando em 24h" e atalho "aguardando resultado".
 */
@Injectable()
export class ObterVisaoGeralDashboardUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(
    input: ObterVisaoGeralDashboardInput,
    agora: Date = new Date(),
  ): Promise<ObterVisaoGeralDashboardOutput> {
    const todasAsCampanhas = await this.campanhaRepository.listarPorAdministrador(
      input.administradorId,
    );

    if (todasAsCampanhas.length === 0) {
      return { temCampanhas: false, campanhas: [] };
    }

    const campanhasAtivas = todasAsCampanhas.filter((campanha) =>
      STATUS_VENDAS_ATIVOS.includes(campanha.statusVendas),
    );

    const resumos: CampanhaResumoDashboard[] = [];
    for (const campanha of campanhasAtivas) {
      const cotasPagas = await this.cotaRepository.contarPagasPorCampanha(campanha.id);
      resumos.push({
        campanhaId: campanha.id,
        status: campanha.statusVendas,
        percentualVendido: campanha.calcularPercentualVendido(cotasPagas),
        encerrandoEm24h: campanha.estaEncerrandoEm24h(agora),
        aguardandoResultado: campanha.estaAguardandoResultado(),
      });
    }

    return { temCampanhas: true, campanhas: resumos };
  }
}

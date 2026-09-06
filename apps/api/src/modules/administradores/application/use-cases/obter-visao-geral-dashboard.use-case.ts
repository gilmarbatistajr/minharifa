import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../sorteios/domain/repositories/cota.repository';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';

export interface ObterVisaoGeralDashboardInput {
  administradorId: string;
}

export interface SorteioResumoDashboard {
  sorteioId: string;
  status: string;
  percentualVendido: number;
  encerrandoEm24h: boolean;
  aguardandoResultado: boolean;
}

export interface ObterVisaoGeralDashboardOutput {
  temSorteios: boolean;
  sorteios: SorteioResumoDashboard[];
}

const STATUS_ATIVOS = ['VENDAS_ABERTAS', 'COTAS_ESGOTADAS'];

/**
 * Cobre dashboard-visao-geral.feature: visão com sorteios ativos, onboarding
 * sem sorteios, atalho "encerrando em 24h" e atalho "aguardando resultado".
 */
@Injectable()
export class ObterVisaoGeralDashboardUseCase {
  constructor(
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(
    input: ObterVisaoGeralDashboardInput,
    agora: Date = new Date(),
  ): Promise<ObterVisaoGeralDashboardOutput> {
    const todosOsSorteios = await this.sorteioRepository.listarPorAdministrador(
      input.administradorId,
    );

    if (todosOsSorteios.length === 0) {
      return { temSorteios: false, sorteios: [] };
    }

    const sorteiosAtivos = todosOsSorteios.filter((sorteio) =>
      STATUS_ATIVOS.includes(sorteio.status),
    );

    const resumos: SorteioResumoDashboard[] = [];
    for (const sorteio of sorteiosAtivos) {
      const cotasPagas = await this.cotaRepository.contarPagasPorSorteio(sorteio.id);
      resumos.push({
        sorteioId: sorteio.id,
        status: sorteio.status,
        percentualVendido: sorteio.calcularPercentualVendido(cotasPagas),
        encerrandoEm24h: sorteio.estaEncerrandoEm24h(agora),
        aguardandoResultado: sorteio.estaAguardandoResultado(),
      });
    }

    return { temSorteios: true, sorteios: resumos };
  }
}

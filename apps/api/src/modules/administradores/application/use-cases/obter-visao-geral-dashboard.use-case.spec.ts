import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { ObterVisaoGeralDashboardUseCase } from './obter-visao-geral-dashboard.use-case';

/**
 * Cobre dashboard-visao-geral.feature: visão geral com sorteios ativos,
 * onboarding sem sorteios, atalho de encerramento em 24h e atalho de
 * cotas esgotadas aguardando resultado.
 */
describe('ObterVisaoGeralDashboardUseCase', () => {
  function criarSorteioRepositorio(sorteios: Sorteio[]): SorteioRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(sorteios),
      salvar: jest.fn(),
    };
  }

  function criarCotaRepositorio(cotasPagas: number): CotaRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn(),
      contarPagasPorSorteio: jest.fn().mockResolvedValue(cotasPagas),
      salvar: jest.fn(),
    };
  }

  it('retorna onboarding quando o administrador não tem nenhum sorteio', async () => {
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarSorteioRepositorio([]),
      criarCotaRepositorio(0),
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado.temSorteios).toBe(false);
    expect(resultado.sorteios).toEqual([]);
  });

  it('retorna KPIs para sorteios ativos, incluindo percentual vendido', async () => {
    const sorteio = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-20T00:00:00Z'),
      new Date('2026-01-21T00:00:00Z'),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarSorteioRepositorio([sorteio]),
      criarCotaRepositorio(40),
    );

    const resultado = await useCase.executar(
      { administradorId: 'admin-1' },
      new Date('2026-01-10T00:00:00Z'),
    );

    expect(resultado.temSorteios).toBe(true);
    expect(resultado.sorteios).toEqual([
      {
        sorteioId: 'sorteio-1',
        status: 'VENDAS_ABERTAS',
        percentualVendido: 40,
        encerrandoEm24h: false,
        aguardandoResultado: false,
      },
    ]);
  });

  it('sinaliza o atalho de sorteio encerrando em 24h', async () => {
    const sorteio = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-10T12:00:00Z'),
      new Date('2026-01-11T00:00:00Z'),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarSorteioRepositorio([sorteio]),
      criarCotaRepositorio(10),
    );

    const resultado = await useCase.executar(
      { administradorId: 'admin-1' },
      new Date('2026-01-10T00:00:00Z'),
    );

    expect(resultado.sorteios[0].encerrandoEm24h).toBe(true);
  });

  it('sinaliza o atalho de cotas esgotadas aguardando resultado e ignora sorteios finalizados', async () => {
    const esgotado = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'COTAS_ESGOTADAS',
      null,
      null,
    );
    const finalizado = new Sorteio(
      'sorteio-2',
      'grupo-1',
      'premio-2',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'FINALIZADO',
      7,
      false,
    );
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarSorteioRepositorio([esgotado, finalizado]),
      criarCotaRepositorio(100),
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado.sorteios).toHaveLength(1);
    expect(resultado.sorteios[0].sorteioId).toBe('sorteio-1');
    expect(resultado.sorteios[0].aguardandoResultado).toBe(true);
  });
});

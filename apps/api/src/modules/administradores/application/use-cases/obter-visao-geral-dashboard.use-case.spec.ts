import { Campanha, StatusVendasCampanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { ObterVisaoGeralDashboardUseCase } from './obter-visao-geral-dashboard.use-case';

/**
 * Cobre dashboard-visao-geral.feature: visão geral com campanhas ativas,
 * onboarding sem campanhas, atalho de encerramento em 24h e atalho de
 * cotas esgotadas aguardando resultado.
 */
describe('ObterVisaoGeralDashboardUseCase', () => {
  function criarCampanhaRepositorio(campanhas: Campanha[]): CampanhaRepository {
    return {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(campanhas),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
  }

  function criarCotaRepositorio(cotasPagas: number): CotaRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn().mockResolvedValue(cotasPagas),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
  }

  function criarCampanha(
    id: string,
    datas: [Date, Date, Date],
    statusVendas: StatusVendasCampanha,
    cotaVencedoraNumero: number | null = null,
    vencedorOptouPorDinheiro: boolean | null = null,
  ): Campanha {
    return new Campanha(
      id,
      'admin-1',
      'grupo-1',
      'Campanha de teste',
      'Descrição de teste',
      ['premio-1'],
      datas[0],
      datas[1],
      datas[2],
      100,
      50,
      'ESCOLHA_NUMERO',
      statusVendas === 'FINALIZADO' ? 'FINALIZADA' : 'LIBERADA',
      statusVendas,
      cotaVencedoraNumero,
      vencedorOptouPorDinheiro,
    );
  }

  it('retorna onboarding quando o administrador não tem nenhuma campanha', async () => {
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarCampanhaRepositorio([]),
      criarCotaRepositorio(0),
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado.temCampanhas).toBe(false);
    expect(resultado.campanhas).toEqual([]);
  });

  it('retorna KPIs para campanhas ativas, incluindo percentual vendido', async () => {
    const campanha = criarCampanha(
      'campanha-1',
      [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-20T00:00:00Z'), new Date('2026-01-21T00:00:00Z')],
      'VENDAS_ABERTAS',
    );
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarCampanhaRepositorio([campanha]),
      criarCotaRepositorio(40),
    );

    const resultado = await useCase.executar(
      { administradorId: 'admin-1' },
      new Date('2026-01-10T00:00:00Z'),
    );

    expect(resultado.temCampanhas).toBe(true);
    expect(resultado.campanhas).toEqual([
      {
        campanhaId: 'campanha-1',
        status: 'VENDAS_ABERTAS',
        percentualVendido: 40,
        encerrandoEm24h: false,
        aguardandoResultado: false,
      },
    ]);
  });

  it('sinaliza o atalho de campanha encerrando em 24h', async () => {
    const campanha = criarCampanha(
      'campanha-1',
      [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-10T12:00:00Z'), new Date('2026-01-11T00:00:00Z')],
      'VENDAS_ABERTAS',
    );
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarCampanhaRepositorio([campanha]),
      criarCotaRepositorio(10),
    );

    const resultado = await useCase.executar(
      { administradorId: 'admin-1' },
      new Date('2026-01-10T00:00:00Z'),
    );

    expect(resultado.campanhas[0].encerrandoEm24h).toBe(true);
  });

  it('sinaliza o atalho de cotas esgotadas aguardando resultado e ignora campanhas finalizadas', async () => {
    const esgotada = criarCampanha('campanha-1', [new Date(), new Date(), new Date()], 'COTAS_ESGOTADAS');
    const finalizada = criarCampanha('campanha-2', [new Date(), new Date(), new Date()], 'FINALIZADO', 7, false);
    const useCase = new ObterVisaoGeralDashboardUseCase(
      criarCampanhaRepositorio([esgotada, finalizada]),
      criarCotaRepositorio(100),
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado.campanhas).toHaveLength(1);
    expect(resultado.campanhas[0].campanhaId).toBe('campanha-1');
    expect(resultado.campanhas[0].aguardandoResultado).toBe(true);
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { ListarCotasPublicasCampanhaUseCase } from './listar-cotas-publicas-campanha.use-case';

describe('ListarCotasPublicasCampanhaUseCase', () => {
  function criarCampanha(grupoId: string | null = 'grupo-1'): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      grupoId,
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      3,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarDependencias(campanha: Campanha | null, cotas: Cota[]) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      listarReservadasPorComprador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    return { campanhaRepository, cotaRepository };
  }

  const agora = new Date('2026-01-01T10:00:00Z');

  it('retorna o mapa de cotas sem identificar quem reservou ou pagou cada uma', async () => {
    const cotas = [
      new Cota('cota-1', 'campanha-1', 1, 'DISPONIVEL', null, null, null),
      new Cota('cota-2', 'campanha-1', 2, 'RESERVADA', 'comprador-maria', agora, new Date('2026-01-01T10:05:00Z')),
      new Cota('cota-3', 'campanha-1', 3, 'PAGA', 'comprador-joao', agora, null),
    ];
    const { campanhaRepository, cotaRepository } = criarDependencias(criarCampanha(), cotas);
    const useCase = new ListarCotasPublicasCampanhaUseCase(campanhaRepository, cotaRepository);

    const resultado = await useCase.executar({ campanhaId: 'campanha-1' }, agora);

    expect(resultado).toEqual([
      { numero: 1, status: 'DISPONIVEL' },
      { numero: 2, status: 'RESERVADA' },
      { numero: 3, status: 'PAGA' },
    ]);
    resultado.forEach((cota) => {
      expect(cota).not.toHaveProperty('minhaCota');
      expect(cota).not.toHaveProperty('reservaExpiraEm');
    });
  });

  it('reporta como disponível uma cota cuja reserva já expirou', async () => {
    const cotaExpirada = new Cota(
      'cota-1',
      'campanha-1',
      1,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T09:00:00Z'),
      new Date('2026-01-01T09:02:00Z'),
    );
    const { campanhaRepository, cotaRepository } = criarDependencias(criarCampanha(), [cotaExpirada]);
    const useCase = new ListarCotasPublicasCampanhaUseCase(campanhaRepository, cotaRepository);

    const resultado = await useCase.executar({ campanhaId: 'campanha-1' }, agora);

    expect(resultado).toEqual([{ numero: 1, status: 'DISPONIVEL' }]);
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository, cotaRepository } = criarDependencias(null, []);
    const useCase = new ListarCotasPublicasCampanhaUseCase(campanhaRepository, cotaRepository);

    await expect(useCase.executar({ campanhaId: 'inexistente' })).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha ainda não foi lançada para um grupo', async () => {
    const { campanhaRepository, cotaRepository } = criarDependencias(criarCampanha(null), []);
    const useCase = new ListarCotasPublicasCampanhaUseCase(campanhaRepository, cotaRepository);

    await expect(useCase.executar({ campanhaId: 'campanha-1' })).rejects.toThrow('Campanha não encontrada.');
  });
});

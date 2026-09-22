import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { ListarCotasDaCampanhaUseCase } from './listar-cotas-campanha.use-case';

describe('ListarCotasDaCampanhaUseCase', () => {
  function criarCampanha(grupoId = 'grupo-1'): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      grupoId,
      'Campanha de teste',
      'descrição',
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

  it('retorna o mapa de cotas ordenado por número, sinalizando quais são minhas', async () => {
    const campanha = criarCampanha();
    const cotas = [
      new Cota('cota-3', 'campanha-1', 3, 'DISPONIVEL', null, null, null),
      new Cota('cota-1', 'campanha-1', 1, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-2', 'campanha-1', 2, 'RESERVADA', 'comprador-joao', new Date(), new Date()),
    ];
    const deps = criarDependencias(campanha, cotas);
    const useCase = new ListarCotasDaCampanhaUseCase(deps.campanhaRepository, deps.cotaRepository);

    const resultado = await useCase.executar({
      campanhaId: 'campanha-1',
      grupoId: 'grupo-1',
      compradorId: 'comprador-maria',
    });

    expect(resultado).toEqual([
      { numero: 1, status: 'PAGA', minhaCota: true },
      { numero: 2, status: 'RESERVADA', minhaCota: false },
      { numero: 3, status: 'DISPONIVEL', minhaCota: false },
    ]);
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null, []);
    const useCase = new ListarCotasDaCampanhaUseCase(deps.campanhaRepository, deps.cotaRepository);

    await expect(
      useCase.executar({ campanhaId: 'inexistente', grupoId: 'grupo-1', compradorId: 'comprador-maria' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro grupo (isolamento multi-tenant)', async () => {
    const campanha = criarCampanha('grupo-2');
    const deps = criarDependencias(campanha, []);
    const useCase = new ListarCotasDaCampanhaUseCase(deps.campanhaRepository, deps.cotaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', grupoId: 'grupo-1', compradorId: 'comprador-maria' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });
});

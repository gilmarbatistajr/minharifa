import { Sorteio } from '../../domain/entities/sorteio.entity';
import { SorteioRepository } from '../../domain/repositories/sorteio.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { ListarCotasDoSorteioUseCase } from './listar-cotas-sorteio.use-case';

describe('ListarCotasDoSorteioUseCase', () => {
  function criarSorteio(grupoId = 'grupo-1'): Sorteio {
    return new Sorteio(
      'sorteio-1',
      grupoId,
      'Sorteio de teste',
      'descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      3,
      50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarDependencias(sorteio: Sorteio | null, cotas: Cota[]) {
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(sorteio),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn().mockResolvedValue(cotas),
      contarPagasPorSorteio: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };

    return { sorteioRepository, cotaRepository };
  }

  it('retorna o mapa de cotas ordenado por número, sinalizando quais são minhas', async () => {
    const sorteio = criarSorteio();
    const cotas = [
      new Cota('cota-3', 'sorteio-1', 3, 'DISPONIVEL', null, null, null),
      new Cota('cota-1', 'sorteio-1', 1, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-2', 'sorteio-1', 2, 'RESERVADA', 'comprador-joao', new Date(), new Date()),
    ];
    const deps = criarDependencias(sorteio, cotas);
    const useCase = new ListarCotasDoSorteioUseCase(deps.sorteioRepository, deps.cotaRepository);

    const resultado = await useCase.executar({
      sorteioId: 'sorteio-1',
      grupoId: 'grupo-1',
      compradorId: 'comprador-maria',
    });

    expect(resultado).toEqual([
      { numero: 1, status: 'PAGA', minhaCota: true },
      { numero: 2, status: 'RESERVADA', minhaCota: false },
      { numero: 3, status: 'DISPONIVEL', minhaCota: false },
    ]);
  });

  it('rejeita quando o sorteio não existe', async () => {
    const deps = criarDependencias(null, []);
    const useCase = new ListarCotasDoSorteioUseCase(deps.sorteioRepository, deps.cotaRepository);

    await expect(
      useCase.executar({ sorteioId: 'inexistente', grupoId: 'grupo-1', compradorId: 'comprador-maria' }),
    ).rejects.toThrow('Sorteio não encontrado.');
  });

  it('rejeita quando o sorteio pertence a outro grupo (isolamento multi-tenant)', async () => {
    const sorteio = criarSorteio('grupo-2');
    const deps = criarDependencias(sorteio, []);
    const useCase = new ListarCotasDoSorteioUseCase(deps.sorteioRepository, deps.cotaRepository);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', grupoId: 'grupo-1', compradorId: 'comprador-maria' }),
    ).rejects.toThrow('Sorteio não encontrado.');
  });
});

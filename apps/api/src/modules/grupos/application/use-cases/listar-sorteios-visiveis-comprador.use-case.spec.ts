import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { ListarSorteiosVisiveisParaCompradorUseCase } from './listar-sorteios-visiveis-comprador.use-case';

/**
 * Cobre acesso-via-convite.feature: "Comprador de um grupo não enxerga
 * sorteio de outro grupo" e "...não enxerga sorteio de outro grupo do
 * mesmo admin".
 */
describe('ListarSorteiosVisiveisParaCompradorUseCase', () => {
  function criarSorteioRepositorio(sorteiosPorGrupo: Record<string, Sorteio[]>): SorteioRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockImplementation(async (grupoId: string) => sorteiosPorGrupo[grupoId] ?? []),
      listarPorAdministrador: jest.fn(),
      salvar: jest.fn(),
    };
  }

  it('retorna apenas os sorteios do grupo do comprador autenticado', async () => {
    const sorteioDoGrupoA = new Sorteio(
      'sorteio-a',
      'grupo-a',
      'premio-1',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
    const sorteioDoGrupoB = new Sorteio(
      'sorteio-b',
      'grupo-b',
      'premio-2',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
    const repositorio = criarSorteioRepositorio({
      'grupo-a': [sorteioDoGrupoA],
      'grupo-b': [sorteioDoGrupoB],
    });
    const useCase = new ListarSorteiosVisiveisParaCompradorUseCase(repositorio);

    const resultado = await useCase.executar({ grupoId: 'grupo-a' });

    expect(resultado).toEqual([sorteioDoGrupoA]);
    expect(repositorio.listarPorGrupo).toHaveBeenCalledWith('grupo-a');
  });

  it('não retorna nenhum sorteio quando o grupo não possui sorteios cadastrados', async () => {
    const repositorio = criarSorteioRepositorio({});
    const useCase = new ListarSorteiosVisiveisParaCompradorUseCase(repositorio);

    const resultado = await useCase.executar({ grupoId: 'grupo-sem-sorteios' });

    expect(resultado).toEqual([]);
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { ListarCampanhasVisiveisParaCompradorUseCase } from './listar-campanhas-visiveis-comprador.use-case';

describe('ListarCampanhasVisiveisParaCompradorUseCase', () => {
  function criarCampanhaRepositorio(campanhasPorGrupo: Record<string, Campanha[]>): CampanhaRepository {
    return {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockImplementation(async (grupoId: string) => campanhasPorGrupo[grupoId] ?? []),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
  }

  function criarCampanha(id: string, grupoId: string): Campanha {
    return new Campanha(
      id,
      'admin-1',
      grupoId,
      'Campanha de teste',
      'Descrição de teste',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  it('retorna apenas as campanhas do grupo do comprador autenticado', async () => {
    const campanhaDoGrupoA = criarCampanha('campanha-a', 'grupo-a');
    const campanhaDoGrupoB = criarCampanha('campanha-b', 'grupo-b');
    const repositorio = criarCampanhaRepositorio({
      'grupo-a': [campanhaDoGrupoA],
      'grupo-b': [campanhaDoGrupoB],
    });
    const useCase = new ListarCampanhasVisiveisParaCompradorUseCase(repositorio);

    const resultado = await useCase.executar({ grupoId: 'grupo-a' });

    expect(resultado).toEqual([campanhaDoGrupoA]);
    expect(repositorio.listarPorGrupo).toHaveBeenCalledWith('grupo-a');
  });

  it('não retorna nenhuma campanha quando o grupo não possui campanhas cadastradas', async () => {
    const repositorio = criarCampanhaRepositorio({});
    const useCase = new ListarCampanhasVisiveisParaCompradorUseCase(repositorio);

    const resultado = await useCase.executar({ grupoId: 'grupo-sem-campanhas' });

    expect(resultado).toEqual([]);
  });
});

import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { CotaRepository, ContagemPorComprador } from '../../../campanhas/domain/repositories/cota.repository';
import { RankingCotasCompradasAdministradorUseCase } from './ranking-cotas-compradas-administrador.use-case';

describe('RankingCotasCompradasAdministradorUseCase', () => {
  function criarComprador(id: string, nome: string): Comprador {
    return new Comprador(
      id,
      'grupo-1',
      nome,
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      `${id}@example.com`,
      'hash',
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(contagens: ContagemPorComprador[], compradoresPorId: Record<string, Comprador | null>) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn().mockResolvedValue(contagens),
      listarReservadasPorComprador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    const compradorRepository: CompradorRepository = {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => compradoresPorId[id] ?? null),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };

    return { cotaRepository, compradorRepository };
  }

  it('retorna o top 3 ordenado por quantidade, considerando todos os grupos do administrador', async () => {
    const deps = criarDependencias(
      [
        { compradorId: 'comprador-2', quantidade: 5 },
        { compradorId: 'comprador-1', quantidade: 10 },
        { compradorId: 'comprador-3', quantidade: 8 },
        { compradorId: 'comprador-4', quantidade: 1 },
      ],
      {
        'comprador-1': criarComprador('comprador-1', 'Maria'),
        'comprador-2': criarComprador('comprador-2', 'João'),
        'comprador-3': criarComprador('comprador-3', 'Ana'),
      },
    );
    const useCase = new RankingCotasCompradasAdministradorUseCase(deps.cotaRepository, deps.compradorRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([
      { posicao: 1, medalha: 'OURO', compradorId: 'comprador-1', nome: 'Maria', quantidade: 10 },
      { posicao: 2, medalha: 'PRATA', compradorId: 'comprador-3', nome: 'Ana', quantidade: 8 },
      { posicao: 3, medalha: 'BRONZE', compradorId: 'comprador-2', nome: 'João', quantidade: 5 },
    ]);
  });

  it('retorna lista vazia quando ninguém comprou cotas ainda', async () => {
    const deps = criarDependencias([], {});
    const useCase = new RankingCotasCompradasAdministradorUseCase(deps.cotaRepository, deps.compradorRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([]);
  });
});

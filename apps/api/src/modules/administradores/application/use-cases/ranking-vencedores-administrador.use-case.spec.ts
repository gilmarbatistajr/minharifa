import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { RankingVencedoresAdministradorUseCase } from './ranking-vencedores-administrador.use-case';

describe('RankingVencedoresAdministradorUseCase', () => {
  function criarCampanhaFinalizada(
    id: string,
    grupoId: string,
    cotaVencedoraNumero: number | null,
    status: Campanha['status'] = 'FINALIZADA',
  ): Campanha {
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
      status,
      status === 'FINALIZADA' ? 'FINALIZADO' : 'VENDAS_ABERTAS',
      cotaVencedoraNumero,
      null,
    );
  }

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

  function criarDependencias(
    campanhas: Campanha[],
    cotasPorCampanhaENumero: Record<string, Cota | null>,
    compradoresPorId: Record<string, Comprador | null>,
  ) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(campanhas),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest
        .fn()
        .mockImplementation(async (campanhaId: string, numero: number) =>
          cotasPorCampanhaENumero[`${campanhaId}-${numero}`] ?? null,
        ),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
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

    return { campanhaRepository, cotaRepository, compradorRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new RankingVencedoresAdministradorUseCase(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.compradorRepository,
    );
  }

  it('conta as vitórias por comprador entre todos os grupos do administrador', async () => {
    const campanhas = [
      criarCampanhaFinalizada('campanha-1', 'grupo-1', 10),
      criarCampanhaFinalizada('campanha-2', 'grupo-2', 20),
      criarCampanhaFinalizada('campanha-3', 'grupo-1', 30),
      criarCampanhaFinalizada('campanha-4', 'grupo-1', null, 'LIBERADA'),
      criarCampanhaFinalizada('campanha-5', 'grupo-2', 5, 'AGUARDANDO_LIBERACAO'),
    ];
    const cotasPorCampanhaENumero: Record<string, Cota | null> = {
      'campanha-1-10': new Cota('cota-1', 'campanha-1', 10, 'PAGA', 'comprador-1', new Date(), null),
      'campanha-2-20': new Cota('cota-2', 'campanha-2', 20, 'PAGA', 'comprador-1', new Date(), null),
      'campanha-3-30': new Cota('cota-3', 'campanha-3', 30, 'PAGA', 'comprador-2', new Date(), null),
    };
    const deps = criarDependencias(campanhas, cotasPorCampanhaENumero, {
      'comprador-1': criarComprador('comprador-1', 'Maria'),
      'comprador-2': criarComprador('comprador-2', 'João'),
    });
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([
      { posicao: 1, medalha: 'OURO', compradorId: 'comprador-1', nome: 'Maria', quantidade: 2 },
      { posicao: 2, medalha: 'PRATA', compradorId: 'comprador-2', nome: 'João', quantidade: 1 },
    ]);
    expect(deps.campanhaRepository.listarPorAdministrador).toHaveBeenCalledWith('admin-1');
  });

  it('retorna lista vazia quando nenhuma campanha foi finalizada', async () => {
    const deps = criarDependencias([], {}, {});
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([]);
  });
});

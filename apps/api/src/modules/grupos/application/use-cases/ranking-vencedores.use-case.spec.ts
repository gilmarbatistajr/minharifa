import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository, CompradorResumo } from '../../domain/repositories/grupo.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { RankingVencedoresUseCase } from './ranking-vencedores.use-case';

describe('RankingVencedoresUseCase', () => {
  const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

  const compradores: CompradorResumo[] = [
    { id: 'comprador-1', nome: 'Maria', telefone: '5511900000001' },
    { id: 'comprador-2', nome: 'João', telefone: '5511900000002' },
    { id: 'comprador-3', nome: 'Ana', telefone: '5511900000003' },
  ];

  function criarCampanhaFinalizada(
    id: string,
    cotaVencedoraNumero: number | null,
    status: Campanha['status'] = 'FINALIZADA',
  ): Campanha {
    return new Campanha(
      id,
      'admin-1',
      'grupo-1',
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
      status === 'FINALIZADA' ? 'FINALIZADO' : 'CANCELADO',
      cotaVencedoraNumero,
      null,
    );
  }

  function criarDependencias(
    grupoRetornado: Grupo | null,
    campanhas: Campanha[],
    cotasPorCampanhaENumero: Record<string, Cota | null>,
  ) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupoRetornado),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn().mockResolvedValue(compradores),
      criar: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockResolvedValue(campanhas),
      listarPorAdministrador: jest.fn(),
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

    return { grupoRepository, campanhaRepository, cotaRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new RankingVencedoresUseCase(deps.grupoRepository, deps.campanhaRepository, deps.cotaRepository);
  }

  it('conta as vitórias por comprador e retorna o top 3 com medalhas', async () => {
    const campanhas = [
      criarCampanhaFinalizada('campanha-1', 10),
      criarCampanhaFinalizada('campanha-2', 20),
      criarCampanhaFinalizada('campanha-3', 30),
      criarCampanhaFinalizada('campanha-4', null, 'LIBERADA'),
      criarCampanhaFinalizada('campanha-5', 5, 'AGUARDANDO_LIBERACAO'),
    ];
    const cotasPorCampanhaENumero: Record<string, Cota | null> = {
      'campanha-1-10': new Cota('cota-1', 'campanha-1', 10, 'PAGA', 'comprador-1', new Date(), null),
      'campanha-2-20': new Cota('cota-2', 'campanha-2', 20, 'PAGA', 'comprador-1', new Date(), null),
      'campanha-3-30': new Cota('cota-3', 'campanha-3', 30, 'PAGA', 'comprador-2', new Date(), null),
    };
    const deps = criarDependencias(grupo, campanhas, cotasPorCampanhaENumero);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([
      { posicao: 1, medalha: 'OURO', compradorId: 'comprador-1', nome: 'Maria', quantidade: 2 },
      { posicao: 2, medalha: 'PRATA', compradorId: 'comprador-2', nome: 'João', quantidade: 1 },
    ]);
  });

  it('ignora campanhas que não estão finalizadas ou sem cota vencedora', async () => {
    const campanhas = [
      criarCampanhaFinalizada('campanha-1', null, 'FINALIZADA'),
      criarCampanhaFinalizada('campanha-2', 5, 'LIBERADA'),
    ];
    const deps = criarDependencias(grupo, campanhas, {});
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([]);
    expect(deps.cotaRepository.buscarPorCampanhaENumero).not.toHaveBeenCalled();
  });

  it('retorna lista vazia quando nenhuma campanha foi finalizada', async () => {
    const deps = criarDependencias(grupo, [], {});
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([]);
  });

  it('rejeita quando o grupo não existe', async () => {
    const deps = criarDependencias(null, [], {});
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const outroGrupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(outroGrupo, [], {});
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

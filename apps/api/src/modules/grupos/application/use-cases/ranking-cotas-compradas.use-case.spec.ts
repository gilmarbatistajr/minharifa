import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository, CompradorResumo } from '../../domain/repositories/grupo.repository';
import { CotaRepository, ContagemPorComprador } from '../../../campanhas/domain/repositories/cota.repository';
import { RankingCotasCompradasUseCase } from './ranking-cotas-compradas.use-case';

describe('RankingCotasCompradasUseCase', () => {
  const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

  const compradores: CompradorResumo[] = [
    { id: 'comprador-1', nome: 'Maria', telefone: '5511900000001' },
    { id: 'comprador-2', nome: 'João', telefone: '5511900000002' },
    { id: 'comprador-3', nome: 'Ana', telefone: '5511900000003' },
    { id: 'comprador-4', nome: 'Pedro', telefone: '5511900000004' },
  ];

  function criarDependencias(
    grupoRetornado: Grupo | null,
    contagens: ContagemPorComprador[],
  ) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupoRetornado),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn().mockResolvedValue(compradores),
      criar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn().mockResolvedValue(contagens),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };

    return { grupoRepository, cotaRepository };
  }

  it('retorna o top 3 ordenado por quantidade, com medalhas', async () => {
    const deps = criarDependencias(grupo, [
      { compradorId: 'comprador-2', quantidade: 5 },
      { compradorId: 'comprador-1', quantidade: 10 },
      { compradorId: 'comprador-3', quantidade: 8 },
      { compradorId: 'comprador-4', quantidade: 1 },
    ]);
    const useCase = new RankingCotasCompradasUseCase(deps.grupoRepository, deps.cotaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([
      { posicao: 1, medalha: 'OURO', compradorId: 'comprador-1', nome: 'Maria', quantidade: 10 },
      { posicao: 2, medalha: 'PRATA', compradorId: 'comprador-3', nome: 'Ana', quantidade: 8 },
      { posicao: 3, medalha: 'BRONZE', compradorId: 'comprador-2', nome: 'João', quantidade: 5 },
    ]);
  });

  it('retorna menos de 3 itens quando há poucos compradores com cotas', async () => {
    const deps = criarDependencias(grupo, [{ compradorId: 'comprador-1', quantidade: 3 }]);
    const useCase = new RankingCotasCompradasUseCase(deps.grupoRepository, deps.cotaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].medalha).toBe('OURO');
  });

  it('retorna lista vazia quando ninguém comprou cotas ainda', async () => {
    const deps = criarDependencias(grupo, []);
    const useCase = new RankingCotasCompradasUseCase(deps.grupoRepository, deps.cotaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([]);
  });

  it('rejeita quando o grupo não existe', async () => {
    const deps = criarDependencias(null, []);
    const useCase = new RankingCotasCompradasUseCase(deps.grupoRepository, deps.cotaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const outroGrupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(outroGrupo, []);
    const useCase = new RankingCotasCompradasUseCase(deps.grupoRepository, deps.cotaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

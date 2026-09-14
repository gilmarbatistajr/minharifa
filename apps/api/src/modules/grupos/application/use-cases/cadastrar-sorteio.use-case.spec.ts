import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Premio } from '../../../premios/domain/entities/premio.entity';
import { PremioRepository } from '../../../premios/domain/repositories/premio.repository';
import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { CadastrarSorteioUseCase } from './cadastrar-sorteio.use-case';

describe('CadastrarSorteioUseCase', () => {
  const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
  const premio = new Premio('premio-1', 'admin-1', 'iPhone 16 Pro', 'desc', 'foto.png', 8000, null, new Date());

  const inputBase = {
    administradorId: 'admin-1',
    grupoId: 'grupo-1',
    nome: 'Sorteio de Natal',
    descricao: 'Sorteio especial de fim de ano',
    premioIds: ['premio-1'],
    quantidadeCotas: 10,
    valorCota: 50,
    dataAberturaVendas: new Date('2026-01-01T00:00:00Z'),
    dataEncerramentoVendas: new Date('2026-01-10T00:00:00Z'),
    dataRealizacao: new Date('2026-01-11T00:00:00Z'),
  };

  function criarDependencias(
    grupoRetornado: Grupo | null = grupo,
    premioRetornado: Premio | null = premio,
  ) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupoRetornado),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const premioRepository: PremioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(premioRetornado),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn(),
      contarPagasPorSorteio: jest.fn(),
      criarEmLote: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };

    return { grupoRepository, premioRepository, sorteioRepository, cotaRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new CadastrarSorteioUseCase(
      deps.grupoRepository,
      deps.premioRepository,
      deps.sorteioRepository,
      deps.cotaRepository,
    );
  }

  it('cadastra o sorteio e materializa as cotas disponíveis', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.sorteioId).toBeDefined();
    expect(deps.sorteioRepository.criar).toHaveBeenCalledTimes(1);
    const sorteioCriado = (deps.sorteioRepository.criar as jest.Mock).mock.calls[0][0];
    expect(sorteioCriado.premioIds).toEqual(['premio-1']);
    expect(sorteioCriado.status).toBe('AGUARDANDO_ABERTURA');

    expect(deps.cotaRepository.criarEmLote).toHaveBeenCalledTimes(1);
    const cotasCriadas = (deps.cotaRepository.criarEmLote as jest.Mock).mock.calls[0][0] as Cota[];
    expect(cotasCriadas).toHaveLength(10);
    expect(cotasCriadas[0].numero).toBe(1);
    expect(cotasCriadas[9].numero).toBe(10);
    expect(cotasCriadas.every((cota) => cota.status === 'DISPONIVEL')).toBe(true);
  });

  it('aceita múltiplos prêmios selecionados', async () => {
    const premio2 = new Premio('premio-2', 'admin-1', 'AirPods', 'desc', 'foto2.png', 1500, null, new Date());
    const deps = criarDependencias();
    (deps.premioRepository.buscarPorId as jest.Mock).mockImplementation(async (id: string) =>
      id === 'premio-1' ? premio : id === 'premio-2' ? premio2 : null,
    );
    const useCase = montarUseCase(deps);

    await useCase.executar({ ...inputBase, premioIds: ['premio-1', 'premio-2'] });

    const sorteioCriado = (deps.sorteioRepository.criar as jest.Mock).mock.calls[0][0];
    expect(sorteioCriado.premioIds).toEqual(['premio-1', 'premio-2']);
  });

  it('rejeita quando o grupo não existe', async () => {
    const deps = criarDependencias(null);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const outroGrupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(outroGrupo);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando nenhum prêmio é selecionado', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, premioIds: [] })).rejects.toThrow(
      'Selecione ao menos um prêmio',
    );
  });

  it('rejeita quando um prêmio selecionado não existe ou não pertence ao administrador', async () => {
    const deps = criarDependencias(grupo, null);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow(
      'Um dos prêmios selecionados não foi encontrado.',
    );
  });

  it('rejeita quantidade de cotas inválida', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, quantidadeCotas: 0 })).rejects.toThrow(
      'quantidade de cotas deve ser maior que zero',
    );
  });

  it('rejeita valor de cota inválido', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, valorCota: -1 })).rejects.toThrow(
      'valor da cota deve ser maior que zero',
    );
  });

  it('rejeita quando o encerramento das vendas não é depois da abertura', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({
        ...inputBase,
        dataAberturaVendas: new Date('2026-01-10T00:00:00Z'),
        dataEncerramentoVendas: new Date('2026-01-05T00:00:00Z'),
      }),
    ).rejects.toThrow('encerramento das vendas deve ser depois da abertura');
  });

  it('rejeita quando a realização é antes do encerramento das vendas', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({
        ...inputBase,
        dataEncerramentoVendas: new Date('2026-01-10T00:00:00Z'),
        dataRealizacao: new Date('2026-01-05T00:00:00Z'),
      }),
    ).rejects.toThrow('data de realização deve ser igual ou depois');
  });
});

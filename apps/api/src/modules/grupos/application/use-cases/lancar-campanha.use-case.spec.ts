import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { LancarCampanhaUseCase } from './lancar-campanha.use-case';

describe('LancarCampanhaUseCase', () => {
  const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      null,
      'Campanha de Natal',
      'Descrição',
      ['premio-1'],
      null,
      null,
      null,
      10,
      50,
      'ESCOLHA_NUMERO',
      'AGUARDANDO_LIBERACAO',
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );
  }

  function criarDependencias(grupoRetornado: Grupo | null, campanha: Campanha | null) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupoRetornado),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };

    return { grupoRepository, campanhaRepository, cotaRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new LancarCampanhaUseCase(deps.grupoRepository, deps.campanhaRepository, deps.cotaRepository);
  }

  const inputBase = {
    administradorId: 'admin-1',
    grupoId: 'grupo-1',
    campanhaId: 'campanha-1',
    dataAberturaVendas: new Date('2026-02-01T00:00:00Z'),
    dataEncerramentoVendas: new Date('2026-02-10T00:00:00Z'),
    dataRealizacao: new Date('2026-02-11T00:00:00Z'),
  };

  it('lança a campanha, vinculando o grupo e materializando as cotas', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(grupo, campanha);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.campanhaId).toBe('campanha-1');
    expect(campanha.status).toBe('LIBERADA');
    expect(campanha.grupoId).toBe('grupo-1');
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
    expect(deps.cotaRepository.criarEmLote).toHaveBeenCalledTimes(1);
    const cotasCriadas = (deps.cotaRepository.criarEmLote as jest.Mock).mock.calls[0][0] as Cota[];
    expect(cotasCriadas).toHaveLength(10);
    expect(cotasCriadas[0].numero).toBe(1);
    expect(cotasCriadas[9].numero).toBe(10);
    expect(cotasCriadas.every((cota) => cota.status === 'DISPONIVEL' && cota.campanhaId === 'campanha-1')).toBe(
      true,
    );
  });

  it('rejeita quando o grupo não existe', async () => {
    const deps = criarDependencias(null, criarCampanha());
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const outroGrupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(outroGrupo, criarCampanha());
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(grupo, null);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const deps = criarDependencias(grupo, criarCampanha('admin-2'));
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Campanha não encontrada.');
  });

  it('propaga o erro de negócio quando a campanha não está aguardando liberação', async () => {
    const campanha = criarCampanha();
    campanha.status = 'NOVO';
    const deps = criarDependencias(grupo, campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Somente campanhas aguardando liberação');
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
    expect(deps.cotaRepository.criarEmLote).not.toHaveBeenCalled();
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { FinalizarCampanhaUseCase } from './finalizar-campanha.use-case';

describe('FinalizarCampanhaUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      'grupo-1',
      'Campanha de teste',
      'Descrição de teste',
      ['premio-1'],
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z'),
      100,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'COTAS_ESGOTADAS',
      null,
      null,
    );
  }

  function criarDependencias(campanha: Campanha | null, cotaVencedora: Cota | null) {
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
      buscarPorCampanhaENumero: jest.fn().mockResolvedValue(cotaVencedora),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };

    return { campanhaRepository, cotaRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new FinalizarCampanhaUseCase(deps.campanhaRepository, deps.cotaRepository);
  }

  const agora = new Date('2026-01-11T00:00:00Z');

  it('finaliza a campanha e retorna o comprador vencedor', async () => {
    const campanha = criarCampanha();
    const cotaVencedora = new Cota('cota-42', 'campanha-1', 42, 'PAGA', 'comprador-maria', new Date(), null);
    const deps = criarDependencias(campanha, cotaVencedora);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(
      { administradorId: 'admin-1', campanhaId: 'campanha-1', cotaVencedoraNumero: 42 },
      agora,
    );

    expect(resultado).toEqual({ campanhaId: 'campanha-1', compradorVencedorId: 'comprador-maria' });
    expect(campanha.status).toBe('FINALIZADA');
    expect(campanha.statusVendas).toBe('FINALIZADO');
    expect(campanha.cotaVencedoraNumero).toBe(42);
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null, null);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar(
        { administradorId: 'admin-1', campanhaId: 'inexistente', cotaVencedoraNumero: 42 },
        agora,
      ),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const deps = criarDependencias(campanha, null);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar(
        { administradorId: 'admin-1', campanhaId: 'campanha-1', cotaVencedoraNumero: 42 },
        agora,
      ),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a cota informada não existe', async () => {
    const deps = criarDependencias(criarCampanha(), null);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar(
        { administradorId: 'admin-1', campanhaId: 'campanha-1', cotaVencedoraNumero: 999 },
        agora,
      ),
    ).rejects.toThrow('A cota vencedora precisa ser uma cota paga por um comprador.');
  });

  it('rejeita quando a cota informada não foi paga', async () => {
    const cotaReservada = new Cota('cota-42', 'campanha-1', 42, 'RESERVADA', 'comprador-maria', new Date(), new Date());
    const deps = criarDependencias(criarCampanha(), cotaReservada);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar(
        { administradorId: 'admin-1', campanhaId: 'campanha-1', cotaVencedoraNumero: 42 },
        agora,
      ),
    ).rejects.toThrow('A cota vencedora precisa ser uma cota paga por um comprador.');
  });

  it('propaga o erro de negócio quando a data de realização ainda não chegou', async () => {
    const campanha = criarCampanha();
    const cotaVencedora = new Cota('cota-42', 'campanha-1', 42, 'PAGA', 'comprador-maria', new Date(), null);
    const deps = criarDependencias(campanha, cotaVencedora);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar(
        { administradorId: 'admin-1', campanhaId: 'campanha-1', cotaVencedoraNumero: 42 },
        new Date('2026-01-05T00:00:00Z'),
      ),
    ).rejects.toThrow('só pode ser finalizada após a data de realização');
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });
});

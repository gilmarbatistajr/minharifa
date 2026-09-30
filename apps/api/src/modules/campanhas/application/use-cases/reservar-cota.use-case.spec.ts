import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { ReservarCotaUseCase } from './reservar-cota.use-case';

/**
 * Cobre os cenários centrais de reserva-de-cota.feature:
 * reserva de cota disponível, conflito de concorrência e reaproveitamento
 * de cota com reserva expirada.
 */
describe('ReservarCotaUseCase', () => {
  function criarCampanha(grupoId: string | null = 'grupo-1'): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      grupoId,
      'Campanha de teste',
      'Descrição',
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

  function criarRepositorioCotaFake(cotaInicial: Cota | null): CotaRepository {
    let estado = cotaInicial;

    return {
      buscarPorId: jest.fn().mockImplementation(async () => estado),
      buscarPorCampanhaENumero: jest.fn().mockImplementation(async () => estado),
      listarPorCampanha: jest.fn().mockImplementation(async () => (estado ? [estado] : [])),
      contarPagasPorCampanha: jest.fn().mockResolvedValue(0),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      listarReservadasPorComprador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockImplementation(async (cota: Cota) => {
        estado = cota;
      }),
    };
  }

  function criarCampanhaRepositorioFake(campanha: Campanha | null): CampanhaRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
  }

  it('reserva com sucesso uma cota disponível', async () => {
    const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
    const cotaRepository = criarRepositorioCotaFake(cota);
    const campanhaRepository = criarCampanhaRepositorioFake(criarCampanha());
    const useCase = new ReservarCotaUseCase(cotaRepository, campanhaRepository);
    const agora = new Date('2026-01-01T10:00:00Z');

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', grupoId: 'grupo-1', numero: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(cota.status).toBe('RESERVADA');
    expect(cota.compradorId).toBe('comprador-maria');
    expect(resultado.reservaExpiraEm).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(cotaRepository.salvar).toHaveBeenCalledWith(cota);
  });

  it('impede reservar uma cota já reservada por outro comprador dentro do prazo', async () => {
    const agoraDaPrimeiraReserva = new Date('2026-01-01T10:00:00Z');
    const cota = new Cota(
      'cota-1',
      'campanha-1',
      42,
      'RESERVADA',
      'comprador-maria',
      agoraDaPrimeiraReserva,
      new Date('2026-01-01T10:02:00Z'),
    );
    const cotaRepository = criarRepositorioCotaFake(cota);
    const campanhaRepository = criarCampanhaRepositorioFake(criarCampanha());
    const useCase = new ReservarCotaUseCase(cotaRepository, campanhaRepository);

    const trintaSegundosDepois = new Date('2026-01-01T10:00:30Z');

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', grupoId: 'grupo-1', numero: 42, compradorId: 'comprador-joao' },
        trintaSegundosDepois,
      ),
    ).rejects.toThrow('não está disponível para reserva');

    expect(cota.compradorId).toBe('comprador-maria');
  });

  it('permite reservar uma cota cuja reserva anterior já expirou', async () => {
    const cota = new Cota(
      'cota-1',
      'campanha-1',
      42,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T10:02:00Z'),
    );
    const cotaRepository = criarRepositorioCotaFake(cota);
    const campanhaRepository = criarCampanhaRepositorioFake(criarCampanha());
    const useCase = new ReservarCotaUseCase(cotaRepository, campanhaRepository);

    const depoisDaExpiracao = new Date('2026-01-01T10:02:01Z');

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', grupoId: 'grupo-1', numero: 42, compradorId: 'comprador-joao' },
      depoisDaExpiracao,
    );

    expect(cota.compradorId).toBe('comprador-joao');
    expect(resultado.cotaId).toBe('cota-1');
  });

  it('lança erro se a cota não existir', async () => {
    const cotaRepository = criarRepositorioCotaFake(null);
    const campanhaRepository = criarCampanhaRepositorioFake(criarCampanha());
    const useCase = new ReservarCotaUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({
        campanhaId: 'campanha-1',
        grupoId: 'grupo-1',
        numero: 999,
        compradorId: 'comprador-maria',
      }),
    ).rejects.toThrow('não existe nessa campanha');
  });

  it('rejeita quando a campanha não existe', async () => {
    const cotaRepository = criarRepositorioCotaFake(null);
    const campanhaRepository = criarCampanhaRepositorioFake(null);
    const useCase = new ReservarCotaUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({
        campanhaId: 'campanha-inexistente',
        grupoId: 'grupo-1',
        numero: 1,
        compradorId: 'comprador-maria',
      }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha não pertence ao grupo do comprador', async () => {
    const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
    const cotaRepository = criarRepositorioCotaFake(cota);
    const campanhaRepository = criarCampanhaRepositorioFake(criarCampanha('grupo-2'));
    const useCase = new ReservarCotaUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({
        campanhaId: 'campanha-1',
        grupoId: 'grupo-1',
        numero: 42,
        compradorId: 'comprador-maria',
      }),
    ).rejects.toThrow('Campanha não encontrada.');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });
});

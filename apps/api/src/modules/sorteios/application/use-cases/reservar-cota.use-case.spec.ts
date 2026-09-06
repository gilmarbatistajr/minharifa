import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { ReservarCotaUseCase } from './reservar-cota.use-case';

/**
 * Cobre os cenários centrais de reserva-de-cota.feature:
 * reserva de cota disponível, conflito de concorrência e reaproveitamento
 * de cota com reserva expirada.
 */
describe('ReservarCotaUseCase', () => {
  function criarRepositorioFake(cotaInicial: Cota): CotaRepository {
    let estado = cotaInicial;

    return {
      buscarPorId: jest.fn().mockImplementation(async () => estado),
      buscarPorSorteioENumero: jest.fn().mockImplementation(async () => estado),
      listarPorSorteio: jest.fn().mockImplementation(async () => [estado]),
      contarPagasPorSorteio: jest.fn().mockResolvedValue(0),
      salvar: jest.fn().mockImplementation(async (cota: Cota) => {
        estado = cota;
      }),
    };
  }

  it('reserva com sucesso uma cota disponível', async () => {
    const cota = new Cota('cota-1', 'sorteio-1', 42, 'DISPONIVEL', null, null, null);
    const repositorio = criarRepositorioFake(cota);
    const useCase = new ReservarCotaUseCase(repositorio);
    const agora = new Date('2026-01-01T10:00:00Z');

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numero: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(cota.status).toBe('RESERVADA');
    expect(cota.compradorId).toBe('comprador-maria');
    expect(resultado.reservaExpiraEm).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(repositorio.salvar).toHaveBeenCalledWith(cota);
  });

  it('impede reservar uma cota já reservada por outro comprador dentro do prazo', async () => {
    const agoraDaPrimeiraReserva = new Date('2026-01-01T10:00:00Z');
    const cota = new Cota(
      'cota-1',
      'sorteio-1',
      42,
      'RESERVADA',
      'comprador-maria',
      agoraDaPrimeiraReserva,
      new Date('2026-01-01T10:02:00Z'),
    );
    const repositorio = criarRepositorioFake(cota);
    const useCase = new ReservarCotaUseCase(repositorio);

    const trintaSegundosDepois = new Date('2026-01-01T10:00:30Z');

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', numero: 42, compradorId: 'comprador-joao' },
        trintaSegundosDepois,
      ),
    ).rejects.toThrow('não está disponível para reserva');

    expect(cota.compradorId).toBe('comprador-maria');
  });

  it('permite reservar uma cota cuja reserva anterior já expirou', async () => {
    const cota = new Cota(
      'cota-1',
      'sorteio-1',
      42,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T10:02:00Z'),
    );
    const repositorio = criarRepositorioFake(cota);
    const useCase = new ReservarCotaUseCase(repositorio);

    const depoisDaExpiracao = new Date('2026-01-01T10:02:01Z');

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numero: 42, compradorId: 'comprador-joao' },
      depoisDaExpiracao,
    );

    expect(cota.compradorId).toBe('comprador-joao');
    expect(resultado.cotaId).toBe('cota-1');
  });

  it('lança erro se a cota não existir', async () => {
    const repositorio: CotaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarPorSorteioENumero: jest.fn().mockResolvedValue(null),
      listarPorSorteio: jest.fn().mockResolvedValue([]),
      contarPagasPorSorteio: jest.fn().mockResolvedValue(0),
      salvar: jest.fn(),
    };
    const useCase = new ReservarCotaUseCase(repositorio);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', numero: 999, compradorId: 'comprador-maria' }),
    ).rejects.toThrow('não existe nesse sorteio');
  });
});

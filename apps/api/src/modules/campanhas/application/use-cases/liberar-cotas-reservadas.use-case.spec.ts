import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { LiberarCotasReservadasUseCase } from './liberar-cotas-reservadas.use-case';

describe('LiberarCotasReservadasUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      'grupo-1',
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      10,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarCota(numero: number): Cota {
    return new Cota(`cota-${numero}`, 'campanha-1', numero, 'RESERVADA', 'comprador-1', new Date(), new Date());
  }

  function criarDependencias(campanha: Campanha | null, cotasReservadas: Cota[]) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      listarReservadasPorComprador: jest.fn().mockResolvedValue(cotasReservadas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { campanhaRepository, cotaRepository };
  }

  it('libera todas as cotas reservadas do comprador', async () => {
    const campanha = criarCampanha();
    const cotas = [criarCota(1), criarCota(2)];
    const { campanhaRepository, cotaRepository } = criarDependencias(campanha, cotas);
    const useCase = new LiberarCotasReservadasUseCase(campanhaRepository, cotaRepository);

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' });

    expect(cotas.every((cota) => cota.status === 'DISPONIVEL')).toBe(true);
    expect(cotas.every((cota) => cota.compradorId === null)).toBe(true);
    expect(cotaRepository.salvar).toHaveBeenCalledTimes(2);
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository, cotaRepository } = criarDependencias(null, []);
    const useCase = new LiberarCotasReservadasUseCase(campanhaRepository, cotaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const { campanhaRepository, cotaRepository } = criarDependencias(campanha, []);
    const useCase = new LiberarCotasReservadasUseCase(campanhaRepository, cotaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando o comprador não tem cotas reservadas', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository, cotaRepository } = criarDependencias(campanha, []);
    const useCase = new LiberarCotasReservadasUseCase(campanhaRepository, cotaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' }),
    ).rejects.toThrow('Este comprador não tem cotas reservadas nesta campanha.');
  });
});

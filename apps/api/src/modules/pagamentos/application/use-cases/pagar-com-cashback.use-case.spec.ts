import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PagarComCashbackUseCase } from './pagar-com-cashback.use-case';

describe('PagarComCashbackUseCase', () => {
  function criarCota(numero: number): Cota {
    return new Cota(
      `cota-${numero}`,
      'campanha-1',
      numero,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T10:02:00Z'),
    );
  }

  function criarCampanha(): Campanha {
    return new Campanha(
      'campanha-1',
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
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarComprador(cashbackDisponivel: number): Comprador {
    return new Comprador(
      'comprador-maria',
      'grupo-1',
      'Maria Silva',
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      'maria@example.com',
      'hash',
      cashbackDisponivel,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(cotasReservadas: Cota[], comprador: Comprador) {
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
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(criarCampanha()),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const compradorRepository: CompradorRepository = {
      buscarPorId: jest.fn().mockResolvedValue(comprador),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn().mockResolvedValue(null),
      listarPorTransacaoGateway: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { cotaRepository, campanhaRepository, compradorRepository, pagamentoRepository };
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('paga a cota integralmente quando o cashback cobre o valor total', async () => {
    const cota = criarCota(42);
    const comprador = criarComprador(50);
    const deps = criarDependencias([cota], comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado).toEqual({ pagoIntegralmente: true, valorAbatido: 50, valorRestante: 0 });
    expect(comprador.cashbackDisponivel).toBe(0);
    expect(cota.status).toBe('PAGA');
  });

  it('abate parcialmente e informa o valor restante quando o cashback é insuficiente', async () => {
    const cota = criarCota(42);
    const comprador = criarComprador(20);
    const deps = criarDependencias([cota], comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado).toEqual({ pagoIntegralmente: false, valorAbatido: 20, valorRestante: 30 });
    expect(comprador.cashbackDisponivel).toBe(0);
    expect(cota.status).toBe('RESERVADA');
    expect(deps.cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('cobre o lote inteiro e confirma todas as cotas quando o cashback é suficiente para a soma', async () => {
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const comprador = criarComprador(150);
    const deps = criarDependencias(cotas, comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [1, 2, 3], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado).toEqual({ pagoIntegralmente: true, valorAbatido: 150, valorRestante: 0 });
    expect(cotas.every((cota) => cota.status === 'PAGA')).toBe(true);
  });

  it('não confirma nenhuma cota do lote quando o cashback cobre só parte da soma', async () => {
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const comprador = criarComprador(80);
    const deps = criarDependencias(cotas, comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [1, 2, 3], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado).toEqual({ pagoIntegralmente: false, valorAbatido: 80, valorRestante: 70 });
    expect(cotas.every((cota) => cota.status === 'RESERVADA')).toBe(true);
    expect(deps.cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando o comprador tenta pagar apenas uma parte das cotas reservadas', async () => {
    const cotas = [criarCota(1), criarCota(2)];
    const comprador = criarComprador(100);
    const deps = criarDependencias(cotas, comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numerosCotas: [1], compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Você precisa pagar todas as suas cotas reservadas de uma só vez.');
    expect(comprador.cashbackDisponivel).toBe(100);
  });

  it('rejeita quando o comprador não tem nenhuma cota reservada para si', async () => {
    const comprador = criarComprador(50);
    const deps = criarDependencias([], comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Você não tem cotas reservadas para pagar nesta campanha.');
  });
});

import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { RegistrarNovaVendaUseCase } from '../../../notificacoes/application/use-cases/registrar-nova-venda.use-case';
import { FinalizarCompraUseCase } from './finalizar-compra.use-case';

describe('FinalizarCompraUseCase', () => {
  function criarCota(numero: number, compradorId: string | null = 'comprador-maria'): Cota {
    return new Cota(
      `cota-${numero}`,
      'campanha-1',
      numero,
      'RESERVADA',
      compradorId,
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T10:02:00Z'),
    );
  }

  function criarPagamento(cotaId: string, finalizadoPeloCompradorEm: Date | null = null): Pagamento {
    return new Pagamento(
      `pagamento-${cotaId}`,
      cotaId,
      'comprador-maria',
      50,
      0,
      'PIX',
      'PENDENTE',
      'txn-1',
      new Date('2026-01-01T10:00:00Z'),
      finalizadoPeloCompradorEm,
    );
  }

  function criarDependencias(cotas: Cota[], pagamentosPorCotaId: Record<string, Pagamento | null> = {}) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn((_campanhaId: string, numero: number) =>
        Promise.resolve(cotas.find((cota) => cota.numero === numero) ?? null),
      ),
      listarPorCampanha: jest.fn(),
      listarReservadasPorComprador: jest.fn(),
      listarReservadasPorTokenConvidado: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn((cotaId: string) => Promise.resolve(pagamentosPorCotaId[cotaId] ?? null)),
      listarPorTransacaoGateway: jest.fn(),
      listarPorCotaIds: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const campanha = new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de Natal',
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
    const campanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
    } as unknown as CampanhaRepository;
    const registrarNovaVenda = { executar: jest.fn().mockResolvedValue(undefined) };
    return {
      cotaRepository,
      pagamentoRepository,
      campanhaRepository,
      registrarNovaVenda: registrarNovaVenda as unknown as RegistrarNovaVendaUseCase,
      registrarNovaVendaMock: registrarNovaVenda,
    };
  }

  const agora = new Date('2026-01-01T10:05:00Z');

  it('marca o pagamento de cada cota informada como finalizado pelo comprador', async () => {
    const cotas = [criarCota(1), criarCota(2)];
    const pagamento1 = criarPagamento('cota-1');
    const pagamento2 = criarPagamento('cota-2');
    const { cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda } = criarDependencias(cotas, {
      'cota-1': pagamento1,
      'cota-2': pagamento2,
    });
    const useCase = new FinalizarCompraUseCase(cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda);

    await useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [1, 2], compradorId: 'comprador-maria' }, agora);

    expect(pagamento1.finalizadoPeloCompradorEm).toBe(agora);
    expect(pagamento2.finalizadoPeloCompradorEm).toBe(agora);
    expect(pagamentoRepository.salvar).toHaveBeenCalledTimes(2);
  });

  it('rejeita quando a cota não existe na campanha', async () => {
    const { cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda } = criarDependencias([]);
    const useCase = new FinalizarCompraUseCase(cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [99], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Cota 99 não pertence a você nesta campanha.');
  });

  it('rejeita quando a cota pertence a outro comprador', async () => {
    const cotas = [criarCota(1, 'comprador-joao')];
    const { cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda } = criarDependencias(cotas);
    const useCase = new FinalizarCompraUseCase(cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [1], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Cota 1 não pertence a você nesta campanha.');
  });

  it('rejeita quando a cota ainda não tem uma cobrança gerada', async () => {
    const cotas = [criarCota(1)];
    const { cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda } = criarDependencias(cotas, { 'cota-1': null });
    const useCase = new FinalizarCompraUseCase(cotaRepository, pagamentoRepository, campanhaRepository, registrarNovaVenda);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [1], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Cota 1 ainda não tem uma cobrança gerada.');
    expect(pagamentoRepository.salvar).not.toHaveBeenCalled();
  });

  it('registra uma única notificação de nova venda por finalização, mesmo com várias cotas', async () => {
    const cotas = [criarCota(1), criarCota(2)];
    const deps = criarDependencias(cotas, {
      'cota-1': criarPagamento('cota-1'),
      'cota-2': criarPagamento('cota-2'),
    });
    const useCase = new FinalizarCompraUseCase(
      deps.cotaRepository,
      deps.pagamentoRepository,
      deps.campanhaRepository,
      deps.registrarNovaVenda,
    );

    await useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [1, 2], compradorId: 'comprador-maria' }, agora);

    expect(deps.registrarNovaVendaMock.executar).toHaveBeenCalledTimes(1);
    expect(deps.registrarNovaVendaMock.executar).toHaveBeenCalledWith(
      { administradorId: 'admin-1', campanhaId: 'campanha-1', grupoId: 'grupo-1', nomeCampanha: 'Campanha de Natal' },
      agora,
    );
  });

  it('não registra nova notificação quando a compra já tinha sido finalizada antes', async () => {
    const cotas = [criarCota(1), criarCota(2)];
    const deps = criarDependencias(cotas, {
      'cota-1': criarPagamento('cota-1', new Date('2026-01-01T10:01:00Z')),
      'cota-2': criarPagamento('cota-2', new Date('2026-01-01T10:01:00Z')),
    });
    const useCase = new FinalizarCompraUseCase(
      deps.cotaRepository,
      deps.pagamentoRepository,
      deps.campanhaRepository,
      deps.registrarNovaVenda,
    );

    await useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [1, 2], compradorId: 'comprador-maria' }, agora);

    expect(deps.registrarNovaVendaMock.executar).not.toHaveBeenCalled();
  });
});

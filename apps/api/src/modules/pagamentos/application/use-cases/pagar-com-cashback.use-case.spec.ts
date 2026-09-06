import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PagarComCashbackUseCase } from './pagar-com-cashback.use-case';

describe('PagarComCashbackUseCase', () => {
  function criarCota(): Cota {
    return new Cota(
      'cota-1',
      'sorteio-1',
      42,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T10:02:00Z'),
    );
  }

  function criarSorteio(): Sorteio {
    const sorteio = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
    return sorteio;
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

  function criarDependencias(cota: Cota, comprador: Comprador) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn().mockResolvedValue(cota),
      listarPorSorteio: jest.fn(),
      contarPagasPorSorteio: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(criarSorteio()),
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
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
      buscarPorTransacaoGateway: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { cotaRepository, sorteioRepository, compradorRepository, pagamentoRepository };
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('paga a cota integralmente quando o cashback cobre o valor total', async () => {
    const cota = criarCota();
    const comprador = criarComprador(50);
    const deps = criarDependencias(cota, comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.sorteioRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado).toEqual({ pagoIntegralmente: true, valorAbatido: 50, valorRestante: 0 });
    expect(comprador.cashbackDisponivel).toBe(0);
    expect(cota.status).toBe('PAGA');
  });

  it('abate parcialmente e informa o valor restante quando o cashback é insuficiente', async () => {
    const cota = criarCota();
    const comprador = criarComprador(20);
    const deps = criarDependencias(cota, comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.sorteioRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado).toEqual({ pagoIntegralmente: false, valorAbatido: 20, valorRestante: 30 });
    expect(comprador.cashbackDisponivel).toBe(0);
    expect(cota.status).toBe('RESERVADA');
    expect(deps.cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando a cota não está reservada para o solicitante', async () => {
    const cota = criarCota();
    cota.compradorId = 'outro-comprador';
    const comprador = criarComprador(50);
    const deps = criarDependencias(cota, comprador);
    const useCase = new PagarComCashbackUseCase(
      deps.cotaRepository,
      deps.sorteioRepository,
      deps.compradorRepository,
      deps.pagamentoRepository,
    );

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('não está reservada para você');
  });
});

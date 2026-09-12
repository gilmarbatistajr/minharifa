import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { GerarCobrancaPixUseCase } from './gerar-cobranca-pix.use-case';

describe('GerarCobrancaPixUseCase', () => {
  function criarCotaReservada(): Cota {
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
    return new Sorteio(
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
  }

  function criarDependencias(
    cota: Cota | null,
    sorteio: Sorteio | null,
    pagamentoExistente: Pagamento | null = null,
  ) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn().mockResolvedValue(cota),
      listarPorSorteio: jest.fn(),
      contarPagasPorSorteio: jest.fn(),
      salvar: jest.fn(),
    };
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(sorteio),
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      salvar: jest.fn(),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn().mockResolvedValue(pagamentoExistente),
      buscarPorTransacaoGateway: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const paymentGateway: PaymentGateway = {
      gerarCobrancaPix: jest.fn().mockResolvedValue({
        transacaoId: 'txn-pix-1',
        qrCode: 'qr-code-fake',
        codigoCopiaCola: 'copia-e-cola-fake',
      }),
      gerarCobrancaCartao: jest.fn(),
      estornar: jest.fn(),
    };

    return { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway };
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('gera uma cobrança Pix pelo valor da cota, válida pelo tempo restante da reserva', async () => {
    const cota = criarCotaReservada();
    const sorteio = criarSorteio();
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, sorteio);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.qrCode).toBe('qr-code-fake');
    expect(resultado.valor).toBe(50);
    expect(resultado.validoAte).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(pagamentoRepository.criar).toHaveBeenCalled();
  });

  it('rejeita quando a cota não está reservada para o solicitante', async () => {
    const cota = criarCotaReservada();
    cota.compradorId = 'outro-comprador';
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, criarSorteio());
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('não está reservada para você');
  });

  it('não persiste nada e propaga o erro quando o gateway está indisponível', async () => {
    const cota = criarCotaReservada();
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, criarSorteio());
    (paymentGateway.gerarCobrancaPix as jest.Mock).mockRejectedValue(
      new Error('Gateway indisponível'),
    );
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Gateway indisponível');

    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('reaproveita um pagamento existente cobrando apenas o valor restante após cashback parcial', async () => {
    const cota = criarCotaReservada();
    const sorteio = criarSorteio();
    const pagamentoExistente = new Pagamento(
      'pagamento-1',
      'cota-1',
      'comprador-maria',
      50,
      20,
      'CASHBACK',
      'PENDENTE',
      null,
      new Date(),
    );
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, sorteio, pagamentoExistente);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(30);
    expect(paymentGateway.gerarCobrancaPix).toHaveBeenCalledWith(30, 'cota-1');
    expect(pagamentoRepository.salvar).toHaveBeenCalledWith(pagamentoExistente);
    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
  });
});

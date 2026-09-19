import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { GerarCobrancaPixUseCase } from './gerar-cobranca-pix.use-case';

describe('GerarCobrancaPixUseCase', () => {
  function criarCotaReservada(): Cota {
    return new Cota(
      'cota-1',
      'campanha-1',
      42,
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

  function criarDependencias(
    cota: Cota | null,
    campanha: Campanha | null,
    pagamentoExistente: Pagamento | null = null,
  ) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn().mockResolvedValue(cota),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
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

    return { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway };
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('gera uma cobrança Pix pelo valor da cota, válida pelo tempo restante da reserva', async () => {
    const cota = criarCotaReservada();
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, campanha);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria' },
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
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, criarCampanha());
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('não está reservada para você');
  });

  it('não persiste nada e propaga o erro quando o gateway está indisponível', async () => {
    const cota = criarCotaReservada();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, criarCampanha());
    (paymentGateway.gerarCobrancaPix as jest.Mock).mockRejectedValue(
      new Error('Gateway indisponível'),
    );
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Gateway indisponível');

    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('reaproveita um pagamento existente cobrando apenas o valor restante após cashback parcial', async () => {
    const cota = criarCotaReservada();
    const campanha = criarCampanha();
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
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, campanha, pagamentoExistente);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(30);
    expect(paymentGateway.gerarCobrancaPix).toHaveBeenCalledWith(30, 'cota-1');
    expect(pagamentoRepository.salvar).toHaveBeenCalledWith(pagamentoExistente);
    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
  });
});

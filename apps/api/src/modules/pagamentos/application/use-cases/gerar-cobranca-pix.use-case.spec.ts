import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { GerarCobrancaPixUseCase } from './gerar-cobranca-pix.use-case';

describe('GerarCobrancaPixUseCase', () => {
  function criarCota(numero: number, reservaExpiraEm: Date | null = new Date('2026-01-01T10:02:00Z')): Cota {
    return new Cota(
      `cota-${numero}`,
      'campanha-1',
      numero,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T10:00:00Z'),
      reservaExpiraEm,
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
    cotasReservadas: Cota[],
    campanha: Campanha | null,
    pagamentosExistentesPorCotaId: Record<string, Pagamento | null> = {},
  ) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      listarReservadasPorComprador: jest.fn().mockResolvedValue(cotasReservadas),
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
      buscarPorCotaId: jest.fn((cotaId: string) => Promise.resolve(pagamentosExistentesPorCotaId[cotaId] ?? null)),
      listarPorTransacaoGateway: jest.fn(),
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
    const cota = criarCota(42);
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias([cota], campanha);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.qrCode).toBe('qr-code-fake');
    expect(resultado.valor).toBe(50);
    expect(resultado.validoAte).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(pagamentoRepository.criar).toHaveBeenCalledTimes(1);
  });

  it('gera uma única cobrança cobrindo todas as cotas reservadas de um lote', async () => {
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cotas, campanha);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [1, 2, 3], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(150);
    expect(paymentGateway.gerarCobrancaPix).toHaveBeenCalledTimes(1);
    expect(paymentGateway.gerarCobrancaPix).toHaveBeenCalledWith(150, expect.any(String));
    expect(pagamentoRepository.criar).toHaveBeenCalledTimes(3);
    for (const chamada of (pagamentoRepository.criar as jest.Mock).mock.calls) {
      expect(chamada[0].idTransacaoGateway).toBe('txn-pix-1');
    }
  });

  it('rejeita quando o comprador tenta pagar apenas uma parte das cotas reservadas', async () => {
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cotas, campanha);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numerosCotas: [1, 2], compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Você precisa pagar todas as suas cotas reservadas de uma só vez.');
    expect(paymentGateway.gerarCobrancaPix).not.toHaveBeenCalled();
    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
  });

  it('rejeita quando o comprador não tem nenhuma cota reservada para si', async () => {
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias([], campanha);
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Você não tem cotas reservadas para pagar nesta campanha.');
  });

  it('não persiste nada e propaga o erro quando o gateway está indisponível', async () => {
    const cota = criarCota(42);
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias([cota], criarCampanha());
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
        { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
        agora,
      ),
    ).rejects.toThrow('Gateway indisponível');

    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('reaproveita um pagamento existente cobrando apenas o valor restante após cashback parcial', async () => {
    const cota = criarCota(42);
    const campanha = criarCampanha();
    const pagamentoExistente = new Pagamento(
      'pagamento-1',
      'cota-42',
      'comprador-maria',
      50,
      20,
      'CASHBACK',
      'PENDENTE',
      null,
      new Date(),
    );
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } = criarDependencias(
      [cota],
      campanha,
      { 'cota-42': pagamentoExistente },
    );
    const useCase = new GerarCobrancaPixUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(30);
    expect(paymentGateway.gerarCobrancaPix).toHaveBeenCalledWith(30, expect.any(String));
    expect(pagamentoRepository.salvar).toHaveBeenCalledWith(pagamentoExistente);
    expect(pagamentoRepository.criar).not.toHaveBeenCalled();
  });
});

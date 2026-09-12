import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { PagarComCartaoUseCase } from './pagar-com-cartao.use-case';

describe('PagarComCartaoUseCase', () => {
  const dadosCartao = { numero: '4111111111111111', validade: '12/30', cvv: '123', nomeTitular: 'Maria Silva' };

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

  function criarDependencias(cota: Cota | null, aprovado: boolean) {
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
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn().mockResolvedValue(null),
      buscarPorTransacaoGateway: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const paymentGateway: PaymentGateway = {
      gerarCobrancaPix: jest.fn(),
      gerarCobrancaCartao: jest.fn().mockResolvedValue({ transacaoId: 'txn-cartao-1', aprovado }),
      estornar: jest.fn(),
    };

    return { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway };
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('confirma o pagamento da cota quando o cartão é aprovado', async () => {
    const cota = criarCotaReservada();
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, true);
    const useCase = new PagarComCartaoUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria', dadosCartao },
      agora,
    );

    expect(resultado.status).toBe('APROVADO');
    expect(cota.status).toBe('PAGA');
    expect(cotaRepository.salvar).toHaveBeenCalledWith(cota);
    expect(pagamentoRepository.criar).toHaveBeenCalled();
  });

  it('mantém a cota reservada quando o cartão é recusado', async () => {
    const cota = criarCotaReservada();
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, false);
    const useCase = new PagarComCartaoUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria', dadosCartao },
      agora,
    );

    expect(resultado.status).toBe('RECUSADO');
    expect(cota.status).toBe('RESERVADA');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando a cota não está reservada para o solicitante', async () => {
    const { cotaRepository, sorteioRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(null, true);
    const useCase = new PagarComCartaoUseCase(
      cotaRepository,
      sorteioRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', numeroCota: 42, compradorId: 'comprador-maria', dadosCartao },
        agora,
      ),
    ).rejects.toThrow('não está reservada para você');
  });
});

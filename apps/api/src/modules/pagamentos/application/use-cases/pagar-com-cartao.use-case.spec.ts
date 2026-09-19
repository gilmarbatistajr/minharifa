import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { PagarComCartaoUseCase } from './pagar-com-cartao.use-case';

describe('PagarComCartaoUseCase', () => {
  const dadosCartao = { numero: '4111111111111111', validade: '12/30', cvv: '123', nomeTitular: 'Maria Silva' };

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

  function criarDependencias(cota: Cota | null, aprovado: boolean) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn().mockResolvedValue(cota),
      listarPorCampanha: jest.fn(),
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

    return { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway };
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('confirma o pagamento da cota quando o cartão é aprovado', async () => {
    const cota = criarCotaReservada();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, true);
    const useCase = new PagarComCartaoUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria', dadosCartao },
      agora,
    );

    expect(resultado.status).toBe('APROVADO');
    expect(cota.status).toBe('PAGA');
    expect(cotaRepository.salvar).toHaveBeenCalledWith(cota);
    expect(pagamentoRepository.criar).toHaveBeenCalled();
  });

  it('mantém a cota reservada quando o cartão é recusado', async () => {
    const cota = criarCotaReservada();
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(cota, false);
    const useCase = new PagarComCartaoUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria', dadosCartao },
      agora,
    );

    expect(resultado.status).toBe('RECUSADO');
    expect(cota.status).toBe('RESERVADA');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando a cota não está reservada para o solicitante', async () => {
    const { cotaRepository, campanhaRepository, pagamentoRepository, paymentGateway } =
      criarDependencias(null, true);
    const useCase = new PagarComCartaoUseCase(
      cotaRepository,
      campanhaRepository,
      pagamentoRepository,
      paymentGateway,
    );

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeroCota: 42, compradorId: 'comprador-maria', dadosCartao },
        agora,
      ),
    ).rejects.toThrow('não está reservada para você');
  });
});

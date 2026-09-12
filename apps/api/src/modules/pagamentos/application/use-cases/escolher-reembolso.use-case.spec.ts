import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { EscolhaPosCancelamento } from '../../domain/entities/escolha-pos-cancelamento.entity';
import { EscolhaPosCancelamentoRepository } from '../../domain/repositories/escolha-pos-cancelamento.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { EscolherReembolsoUseCase } from './escolher-reembolso.use-case';

describe('EscolherReembolsoUseCase', () => {
  function criarEscolha(): EscolhaPosCancelamento {
    return new EscolhaPosCancelamento(
      'escolha-1',
      'sorteio-1',
      'comprador-maria',
      3,
      150,
      'PENDENTE',
      new Date('2026-01-10T00:00:00Z'),
      null,
      new Date('2026-01-01T00:00:00Z'),
    );
  }

  function criarDependencias(escolha: EscolhaPosCancelamento | null, cotas: Cota[], pagamento: Pagamento | null) {
    const escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(escolha),
      listarPendentesExpiradas: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn().mockResolvedValue(cotas),
      contarPagasPorSorteio: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn().mockResolvedValue(pagamento),
      buscarPorTransacaoGateway: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const paymentGateway: PaymentGateway = {
      gerarCobrancaPix: jest.fn(),
      gerarCobrancaCartao: jest.fn(),
      estornar: jest.fn().mockResolvedValue(undefined),
    };

    return { escolhaPosCancelamentoRepository, cotaRepository, pagamentoRepository, paymentGateway };
  }

  it('estorna os pagamentos e marca as cotas como canceladas e reembolsadas', async () => {
    const escolha = criarEscolha();
    const cotas = [
      new Cota('cota-1', 'sorteio-1', 1, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-2', 'sorteio-1', 2, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-3', 'sorteio-1', 3, 'PAGA', 'outro-comprador', new Date(), null),
    ];
    const pagamento = new Pagamento('pagamento-1', 'cota-1', 'comprador-maria', 50, 0, 'PIX', 'APROVADO', 'txn-1', new Date());
    const deps = criarDependencias(escolha, cotas, pagamento);
    const useCase = new EscolherReembolsoUseCase(
      deps.escolhaPosCancelamentoRepository,
      deps.cotaRepository,
      deps.pagamentoRepository,
      deps.paymentGateway,
    );

    await useCase.executar(
      { escolhaId: 'escolha-1', compradorId: 'comprador-maria' },
      new Date('2026-01-05T00:00:00Z'),
    );

    expect(escolha.status).toBe('REEMBOLSO');
    expect(cotas[0].status).toBe('CANCELADA_REEMBOLSADA');
    expect(cotas[1].status).toBe('CANCELADA_REEMBOLSADA');
    expect(cotas[2].status).toBe('PAGA');
    expect(pagamento.status).toBe('ESTORNADO');
    expect(deps.paymentGateway.estornar).toHaveBeenCalledWith('txn-1');
  });

  it('rejeita quando a escolha não pertence ao comprador', async () => {
    const escolha = criarEscolha();
    const deps = criarDependencias(escolha, [], null);
    const useCase = new EscolherReembolsoUseCase(
      deps.escolhaPosCancelamentoRepository,
      deps.cotaRepository,
      deps.pagamentoRepository,
      deps.paymentGateway,
    );

    await expect(
      useCase.executar({ escolhaId: 'escolha-1', compradorId: 'outro-comprador' }),
    ).rejects.toThrow('Escolha não encontrada.');
  });
});

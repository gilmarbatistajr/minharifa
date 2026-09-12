import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { WebhookSignatureValidator } from '../../domain/services/webhook-signature-validator';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { ConfirmarPagamentoWebhookUseCase } from './confirmar-pagamento-webhook.use-case';

describe('ConfirmarPagamentoWebhookUseCase', () => {
  function criarPagamento(status: Pagamento['status'] = 'PENDENTE'): Pagamento {
    return new Pagamento('pagamento-1', 'cota-1', 'comprador-maria', 50, 0, 'PIX', status, 'txn-1', new Date());
  }

  function criarComprador(): Comprador {
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
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(
    pagamento: Pagamento | null,
    cota: Cota | null,
    assinaturaValida = true,
  ) {
    const webhookSignatureValidator: WebhookSignatureValidator = {
      validar: jest.fn().mockReturnValue(assinaturaValida),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn(),
      buscarPorTransacaoGateway: jest.fn().mockResolvedValue(pagamento),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(cota),
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn(),
      contarPagasPorSorteio: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const paymentGateway: PaymentGateway = {
      gerarCobrancaPix: jest.fn(),
      gerarCobrancaCartao: jest.fn(),
      estornar: jest.fn().mockResolvedValue(undefined),
    };
    const compradorRepository: CompradorRepository = {
      buscarPorId: jest.fn().mockResolvedValue(criarComprador()),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };
    const notificationSender: NotificationSender = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

    return {
      webhookSignatureValidator,
      pagamentoRepository,
      cotaRepository,
      paymentGateway,
      compradorRepository,
      notificationSender,
    };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new ConfirmarPagamentoWebhookUseCase(
      deps.webhookSignatureValidator,
      deps.pagamentoRepository,
      deps.cotaRepository,
      deps.paymentGateway,
      deps.compradorRepository,
      deps.notificationSender,
    );
  }

  it('rejeita webhook com assinatura inválida e não altera nada', async () => {
    const deps = criarDependencias(criarPagamento(), null, false);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({
        payloadBruto: '{}',
        assinatura: 'assinatura-invalida',
        transacaoId: 'txn-1',
        statusGateway: 'APROVADO',
      }),
    ).rejects.toThrow('Assinatura do webhook inválida.');

    expect(deps.pagamentoRepository.buscarPorTransacaoGateway).not.toHaveBeenCalled();
    expect(deps.cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('confirma a cota como paga quando a reserva ainda é válida', async () => {
    const cota = new Cota(
      'cota-1',
      'sorteio-1',
      42,
      'RESERVADA',
      'comprador-maria',
      new Date(),
      new Date('2026-01-01T10:02:00Z'),
    );
    const pagamento = criarPagamento();
    const deps = criarDependencias(pagamento, cota);
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(cota.status).toBe('PAGA');
    expect(pagamento.status).toBe('APROVADO');
    expect(deps.paymentGateway.estornar).not.toHaveBeenCalled();
  });

  it('estorna automaticamente quando o webhook chega após a reserva expirar (cota já disponível)', async () => {
    const cota = new Cota('cota-1', 'sorteio-1', 42, 'DISPONIVEL', null, null, null);
    const pagamento = criarPagamento();
    const deps = criarDependencias(pagamento, cota);
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(pagamento.status).toBe('ESTORNADO');
    expect(deps.paymentGateway.estornar).toHaveBeenCalledWith('txn-1');
    expect(deps.notificationSender.enviarEmail).toHaveBeenCalled();
    expect(cota.status).toBe('DISPONIVEL');
  });

  it('estorna automaticamente quando a cota já foi vendida a outra pessoa', async () => {
    const cota = new Cota('cota-1', 'sorteio-1', 42, 'PAGA', 'comprador-joao', new Date(), null);
    const pagamento = criarPagamento();
    const deps = criarDependencias(pagamento, cota);
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(pagamento.status).toBe('ESTORNADO');
    expect(cota.compradorId).toBe('comprador-joao');
  });

  it('marca o pagamento como recusado quando o gateway recusa', async () => {
    const pagamento = criarPagamento();
    const deps = criarDependencias(pagamento, null);
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'RECUSADO',
    });

    expect(pagamento.status).toBe('RECUSADO');
  });

  it('ignora webhooks repetidos para um pagamento já processado (idempotência)', async () => {
    const pagamento = criarPagamento('APROVADO');
    const deps = criarDependencias(pagamento, null);
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(deps.cotaRepository.buscarPorId).not.toHaveBeenCalled();
    expect(deps.pagamentoRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando não existe pagamento para a transação informada', async () => {
    const deps = criarDependencias(null, null);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({
        payloadBruto: '{}',
        assinatura: 'assinatura-valida',
        transacaoId: 'txn-inexistente',
        statusGateway: 'APROVADO',
      }),
    ).rejects.toThrow('Pagamento não encontrado para esta transação.');
  });
});

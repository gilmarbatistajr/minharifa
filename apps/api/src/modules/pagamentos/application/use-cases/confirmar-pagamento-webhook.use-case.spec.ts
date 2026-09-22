import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PaymentGateway } from '../../domain/services/payment-gateway';
import { WebhookSignatureValidator } from '../../domain/services/webhook-signature-validator';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { ConfirmarPagamentoWebhookUseCase } from './confirmar-pagamento-webhook.use-case';

describe('ConfirmarPagamentoWebhookUseCase', () => {
  function criarPagamento(cotaId: string, status: Pagamento['status'] = 'PENDENTE'): Pagamento {
    return new Pagamento(`pagamento-${cotaId}`, cotaId, 'comprador-maria', 50, 0, 'PIX', status, 'txn-1', new Date());
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
    pagamentos: Pagamento[],
    cotasPorId: Record<string, Cota | null>,
    assinaturaValida = true,
    campanha: Campanha | null = null,
  ) {
    const webhookSignatureValidator: WebhookSignatureValidator = {
      validar: jest.fn().mockReturnValue(assinaturaValida),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn(),
      listarPorTransacaoGateway: jest.fn().mockResolvedValue(pagamentos),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn((id: string) => Promise.resolve(cotasPorId[id] ?? null)),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(Object.values(cotasPorId).filter((cota): cota is Cota => cota !== null)),
      listarReservadasPorComprador: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
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
    const notificationSender: NotificationSender = {
      enviarEmail: jest.fn().mockResolvedValue(undefined),
      enviarWhatsapp: jest.fn().mockResolvedValue(undefined),
    };

    return {
      webhookSignatureValidator,
      pagamentoRepository,
      cotaRepository,
      campanhaRepository,
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
      deps.campanhaRepository,
      deps.paymentGateway,
      deps.compradorRepository,
      deps.notificationSender,
    );
  }

  it('rejeita webhook com assinatura inválida e não altera nada', async () => {
    const deps = criarDependencias([criarPagamento('cota-1')], {}, false);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({
        payloadBruto: '{}',
        assinatura: 'assinatura-invalida',
        transacaoId: 'txn-1',
        statusGateway: 'APROVADO',
      }),
    ).rejects.toThrow('Assinatura do webhook inválida.');

    expect(deps.pagamentoRepository.listarPorTransacaoGateway).not.toHaveBeenCalled();
    expect(deps.cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('confirma a cota como paga quando a reserva ainda é válida', async () => {
    const cota = new Cota(
      'cota-1',
      'campanha-1',
      42,
      'RESERVADA',
      'comprador-maria',
      new Date(),
      new Date('2026-01-01T10:02:00Z'),
    );
    const pagamento = criarPagamento('cota-1');
    const deps = criarDependencias([pagamento], { 'cota-1': cota });
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

  it('confirma todas as cotas de um lote pago numa única transação', async () => {
    const cota1 = new Cota('cota-1', 'campanha-1', 1, 'RESERVADA', 'comprador-maria', new Date(), new Date('2026-01-01T10:02:00Z'));
    const cota2 = new Cota('cota-2', 'campanha-1', 2, 'RESERVADA', 'comprador-maria', new Date(), new Date('2026-01-01T10:02:00Z'));
    const pagamento1 = criarPagamento('cota-1');
    const pagamento2 = criarPagamento('cota-2');
    const deps = criarDependencias([pagamento1, pagamento2], { 'cota-1': cota1, 'cota-2': cota2 });
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(cota1.status).toBe('PAGA');
    expect(cota2.status).toBe('PAGA');
    expect(pagamento1.status).toBe('APROVADO');
    expect(pagamento2.status).toBe('APROVADO');
  });

  it('libera a campanha para sorteio quando o webhook confirma a última cota em aberto', async () => {
    const cota1 = new Cota('cota-1', 'campanha-1', 1, 'RESERVADA', 'comprador-maria', new Date(), new Date('2026-01-01T10:02:00Z'));
    const pagamento1 = criarPagamento('cota-1');
    const campanha = new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      1,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
    const deps = criarDependencias([pagamento1], { 'cota-1': cota1 }, true, campanha);
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(campanha.status).toBe('LIBERADA_PARA_SORTEIO');
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('estorna o lote inteiro quando apenas uma das reservas não é mais válida', async () => {
    const cota1 = new Cota('cota-1', 'campanha-1', 1, 'RESERVADA', 'comprador-maria', new Date(), new Date('2026-01-01T10:02:00Z'));
    const cota2 = new Cota('cota-2', 'campanha-1', 2, 'DISPONIVEL', null, null, null);
    const pagamento1 = criarPagamento('cota-1');
    const pagamento2 = criarPagamento('cota-2');
    const deps = criarDependencias([pagamento1, pagamento2], { 'cota-1': cota1, 'cota-2': cota2 });
    const useCase = montarUseCase(deps);

    await useCase.executar({
      payloadBruto: '{}',
      assinatura: 'assinatura-valida',
      transacaoId: 'txn-1',
      statusGateway: 'APROVADO',
    });

    expect(pagamento1.status).toBe('ESTORNADO');
    expect(pagamento2.status).toBe('ESTORNADO');
    expect(cota1.status).toBe('RESERVADA');
    expect(deps.paymentGateway.estornar).toHaveBeenCalledTimes(1);
    expect(deps.paymentGateway.estornar).toHaveBeenCalledWith('txn-1');
    expect(deps.notificationSender.enviarEmail).toHaveBeenCalledTimes(1);
  });

  it('estorna automaticamente quando o webhook chega após a reserva expirar (cota já disponível)', async () => {
    const cota = new Cota('cota-1', 'campanha-1', 42, 'DISPONIVEL', null, null, null);
    const pagamento = criarPagamento('cota-1');
    const deps = criarDependencias([pagamento], { 'cota-1': cota });
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
    const cota = new Cota('cota-1', 'campanha-1', 42, 'PAGA', 'comprador-joao', new Date(), null);
    const pagamento = criarPagamento('cota-1');
    const deps = criarDependencias([pagamento], { 'cota-1': cota });
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
    const pagamento = criarPagamento('cota-1');
    const deps = criarDependencias([pagamento], {});
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
    const pagamento = criarPagamento('cota-1', 'APROVADO');
    const deps = criarDependencias([pagamento], {});
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
    const deps = criarDependencias([], {});
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

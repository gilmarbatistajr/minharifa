import { Module } from '@nestjs/common';
import { SorteiosModule } from '../sorteios/sorteios.module';
import { GruposModule } from '../grupos/grupos.module';
import { CompradoresModule } from '../compradores/compradores.module';
import { PAGAMENTO_REPOSITORY } from './domain/repositories/pagamento.repository';
import {
  ESCOLHA_POS_CANCELAMENTO_REPOSITORY,
} from './domain/repositories/escolha-pos-cancelamento.repository';
import { CREDITO_PENDENTE_REPOSITORY } from './domain/repositories/credito-pendente.repository';
import { PAYMENT_GATEWAY } from './domain/services/payment-gateway';
import { WEBHOOK_SIGNATURE_VALIDATOR } from './domain/services/webhook-signature-validator';
import { PrismaPagamentoRepository } from './infrastructure/prisma-pagamento.repository';
import { PrismaEscolhaPosCancelamentoRepository } from './infrastructure/prisma-escolha-pos-cancelamento.repository';
import { PrismaCreditoPendenteRepository } from './infrastructure/prisma-credito-pendente.repository';
import { SandboxPaymentGateway } from './infrastructure/sandbox-payment-gateway';
import { HmacWebhookSignatureValidator } from './infrastructure/hmac-webhook-signature-validator';
import { EscolhasExpiradasScheduler } from './infrastructure/escolhas-expiradas.scheduler';
import { GerarCobrancaPixUseCase } from './application/use-cases/gerar-cobranca-pix.use-case';
import { PagarComCartaoUseCase } from './application/use-cases/pagar-com-cartao.use-case';
import { PagarComCashbackUseCase } from './application/use-cases/pagar-com-cashback.use-case';
import { ConfirmarPagamentoWebhookUseCase } from './application/use-cases/confirmar-pagamento-webhook.use-case';
import { IniciarCancelamentoSorteioUseCase } from './application/use-cases/iniciar-cancelamento-sorteio.use-case';
import { EscolherReembolsoUseCase } from './application/use-cases/escolher-reembolso.use-case';
import { EscolherManterCotasUseCase } from './application/use-cases/escolher-manter-cotas.use-case';
import { ResgatarCreditoUseCase } from './application/use-cases/resgatar-credito.use-case';
import { ProcessarEscolhasExpiradasUseCase } from './application/use-cases/processar-escolhas-expiradas.use-case';
import { PagamentosController } from './presentation/pagamentos.controller';

@Module({
  imports: [SorteiosModule, GruposModule, CompradoresModule],
  controllers: [PagamentosController],
  providers: [
    { provide: PAGAMENTO_REPOSITORY, useClass: PrismaPagamentoRepository },
    { provide: ESCOLHA_POS_CANCELAMENTO_REPOSITORY, useClass: PrismaEscolhaPosCancelamentoRepository },
    { provide: CREDITO_PENDENTE_REPOSITORY, useClass: PrismaCreditoPendenteRepository },
    { provide: PAYMENT_GATEWAY, useClass: SandboxPaymentGateway },
    { provide: WEBHOOK_SIGNATURE_VALIDATOR, useClass: HmacWebhookSignatureValidator },
    EscolhasExpiradasScheduler,
    GerarCobrancaPixUseCase,
    PagarComCartaoUseCase,
    PagarComCashbackUseCase,
    ConfirmarPagamentoWebhookUseCase,
    IniciarCancelamentoSorteioUseCase,
    EscolherReembolsoUseCase,
    EscolherManterCotasUseCase,
    ResgatarCreditoUseCase,
    ProcessarEscolhasExpiradasUseCase,
  ],
})
export class PagamentosModule {}

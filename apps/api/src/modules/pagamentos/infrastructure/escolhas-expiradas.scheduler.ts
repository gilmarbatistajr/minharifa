import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessarEscolhasExpiradasUseCase } from '../application/use-cases/processar-escolhas-expiradas.use-case';

/**
 * Roda periodicamente para converter em cashback as escolhas pós-cancelamento
 * cujo prazo expirou sem manifestação do comprador (ver
 * cancelamento-de-sorteio.feature).
 */
@Injectable()
export class EscolhasExpiradasScheduler {
  private readonly logger = new Logger(EscolhasExpiradasScheduler.name);

  constructor(private readonly processarEscolhasExpiradasUseCase: ProcessarEscolhasExpiradasUseCase) {}

  @Cron(CronExpression.EVERY_HOUR)
  async executar(): Promise<void> {
    const resultado = await this.processarEscolhasExpiradasUseCase.executar();

    if (resultado.processadas > 0) {
      this.logger.log(`${resultado.processadas} escolha(s) pós-cancelamento convertida(s) em cashback.`);
    }
  }
}

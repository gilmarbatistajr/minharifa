import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../sorteios/domain/repositories/cota.repository';
import {
  ESCOLHA_POS_CANCELAMENTO_REPOSITORY,
  EscolhaPosCancelamentoRepository,
} from '../../domain/repositories/escolha-pos-cancelamento.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';

export interface EscolherReembolsoInput {
  escolhaId: string;
  compradorId: string;
}

/** Cobre cancelamento-de-sorteio.feature: "Comprador escolhe reembolso do valor investido". */
@Injectable()
export class EscolherReembolsoUseCase {
  constructor(
    @Inject(ESCOLHA_POS_CANCELAMENTO_REPOSITORY)
    private readonly escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async executar(input: EscolherReembolsoInput, agora: Date = new Date()): Promise<void> {
    const escolha = await this.escolhaPosCancelamentoRepository.buscarPorId(input.escolhaId);

    if (!escolha || escolha.compradorId !== input.compradorId) {
      throw new Error('Escolha não encontrada.');
    }

    escolha.escolherReembolso(agora);

    const cotasDoSorteio = await this.cotaRepository.listarPorSorteio(escolha.sorteioId);
    const cotasPagas = cotasDoSorteio.filter(
      (cota) => cota.status === 'PAGA' && cota.compradorId === input.compradorId,
    );

    for (const cota of cotasPagas) {
      const pagamento = await this.pagamentoRepository.buscarPorCotaId(cota.id);

      if (pagamento && pagamento.status === 'APROVADO') {
        pagamento.estornar();
        await this.pagamentoRepository.salvar(pagamento);

        if (pagamento.idTransacaoGateway) {
          await this.paymentGateway.estornar(pagamento.idTransacaoGateway);
        }
      }

      cota.cancelarEReembolsar();
      await this.cotaRepository.salvar(cota);
    }

    await this.escolhaPosCancelamentoRepository.salvar(escolha);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../sorteios/domain/repositories/cota.repository';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';

export interface PagarComCashbackInput {
  sorteioId: string;
  numeroCota: number;
  compradorId: string;
}

export interface PagarComCashbackOutput {
  pagoIntegralmente: boolean;
  valorAbatido: number;
  valorRestante: number;
}

/**
 * Cobre pagamento-de-cota.feature: "Pagamento de uma cota usando cashback
 * disponível" e "Cashback insuficiente para cobrir o valor total da cota".
 */
@Injectable()
export class PagarComCashbackUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async executar(input: PagarComCashbackInput, agora: Date = new Date()): Promise<PagarComCashbackOutput> {
    const cota = await this.cotaRepository.buscarPorSorteioENumero(input.sorteioId, input.numeroCota);

    if (
      !cota ||
      cota.status !== 'RESERVADA' ||
      cota.compradorId !== input.compradorId ||
      (cota.reservaExpiraEm && agora > cota.reservaExpiraEm)
    ) {
      throw new Error('Esta cota não está reservada para você.');
    }

    const sorteio = await this.sorteioRepository.buscarPorId(input.sorteioId);
    if (!sorteio) {
      throw new Error('Sorteio não encontrado.');
    }

    const comprador = await this.compradorRepository.buscarPorId(input.compradorId);
    if (!comprador) {
      throw new Error('Comprador não encontrado.');
    }

    const pagamentoExistente = await this.pagamentoRepository.buscarPorCotaId(cota.id);
    const valorTotal = pagamentoExistente ? pagamentoExistente.valor : sorteio.valorCota;
    const valorJaAplicado = pagamentoExistente ? pagamentoExistente.valorCashbackAplicado : 0;
    const valorEmAberto = valorTotal - valorJaAplicado;

    const valorAbatido = Math.min(comprador.cashbackDisponivel, valorEmAberto);

    if (valorAbatido > 0) {
      comprador.debitarCashback(valorAbatido);
      await this.compradorRepository.salvar(comprador);
    }

    const valorCashbackTotalAplicado = valorJaAplicado + valorAbatido;
    const valorRestante = valorTotal - valorCashbackTotalAplicado;
    const pagoIntegralmente = valorRestante <= 0;

    if (pagamentoExistente) {
      pagamentoExistente.valorCashbackAplicado = valorCashbackTotalAplicado;
      if (pagoIntegralmente) {
        pagamentoExistente.metodo = 'CASHBACK';
        pagamentoExistente.aprovar();
      }
      await this.pagamentoRepository.salvar(pagamentoExistente);
    } else {
      const pagamento = new Pagamento(
        randomUUID(),
        cota.id,
        input.compradorId,
        valorTotal,
        valorCashbackTotalAplicado,
        'CASHBACK',
        pagoIntegralmente ? 'APROVADO' : 'PENDENTE',
        null,
        agora,
      );
      await this.pagamentoRepository.criar(pagamento);
    }

    if (pagoIntegralmente) {
      cota.confirmarPagamento();
      await this.cotaRepository.salvar(cota);
    }

    return { pagoIntegralmente, valorAbatido, valorRestante: Math.max(valorRestante, 0) };
  }
}

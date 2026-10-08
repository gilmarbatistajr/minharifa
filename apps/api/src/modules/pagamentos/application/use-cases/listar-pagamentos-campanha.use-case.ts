import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';

export interface ListarPagamentosCampanhaInput {
  administradorId: string;
  campanhaId: string;
}

export interface PagamentoResumo {
  numero: number;
  valorPago: number;
  finalizadoPeloCompradorEm: Date | null;
}

/**
 * Cobre a coluna "Pagamento" da tela "Cotas compradas" do administrador:
 * valor cobrado por cota e o momento em que o comprador passou pela tela de
 * pagamento e clicou em "Finalizar compra" (ver `FinalizarCompraUseCase`).
 * Só existe pagamento pra cotas que já tiveram uma cobrança Pix gerada.
 */
@Injectable()
export class ListarPagamentosCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async executar(input: ListarPagamentosCampanhaInput): Promise<PagamentoResumo[]> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);
    const pagamentos = await this.pagamentoRepository.listarPorCotaIds(cotas.map((cota) => cota.id));
    const pagamentoPorCotaId = new Map(pagamentos.map((pagamento) => [pagamento.cotaId, pagamento]));

    return cotas
      .map((cota) => {
        const pagamento = pagamentoPorCotaId.get(cota.id);
        if (!pagamento) return null;
        return {
          numero: cota.numero,
          valorPago: pagamento.valor,
          finalizadoPeloCompradorEm: pagamento.finalizadoPeloCompradorEm,
        };
      })
      .filter((item): item is PagamentoResumo => item !== null);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import { RegistrarNovaVendaUseCase } from '../../../notificacoes/application/use-cases/registrar-nova-venda.use-case';

export interface FinalizarCompraConvidadoInput {
  campanhaId: string;
  numerosCotas: number[];
  tokenReservaConvidado: string;
}

/** Mesma regra de `FinalizarCompraUseCase`, para quem comprou sem login. */
@Injectable()
export class FinalizarCompraConvidadoUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    private readonly registrarNovaVenda: RegistrarNovaVendaUseCase,
  ) {}

  async executar(input: FinalizarCompraConvidadoInput, agora: Date = new Date()): Promise<void> {
    let finalizacaoNova = false;

    for (const numero of input.numerosCotas) {
      const cota = await this.cotaRepository.buscarPorCampanhaENumero(input.campanhaId, numero);
      if (!cota || cota.tokenReservaConvidado !== input.tokenReservaConvidado) {
        throw new Error(`Cota ${numero} não pertence a essa reserva nesta campanha.`);
      }

      const pagamento = await this.pagamentoRepository.buscarPorCotaId(cota.id);
      if (!pagamento) {
        throw new Error(`Cota ${numero} ainda não tem uma cobrança gerada.`);
      }

      // Clicar de novo em "Finalizar compra" não gera outro aviso.
      if (!pagamento.finalizadoPeloCompradorEm) {
        finalizacaoNova = true;
      }

      pagamento.marcarFinalizadoPeloComprador(agora);
      await this.pagamentoRepository.salvar(pagamento);
    }

    if (!finalizacaoNova) {
      return;
    }

    // Um único aviso por finalização, mesmo que o lote tenha várias cotas.
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (campanha) {
      await this.registrarNovaVenda.executar(
        {
          administradorId: campanha.administradorId,
          campanhaId: campanha.id,
          grupoId: campanha.grupoId,
          nomeCampanha: campanha.nome,
        },
        agora,
      );
    }
  }
}

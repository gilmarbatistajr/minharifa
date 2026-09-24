import { Inject, Injectable } from '@nestjs/common';
import {
  ESCOLHA_POS_CANCELAMENTO_REPOSITORY,
  EscolhaPosCancelamentoRepository,
} from '../../domain/repositories/escolha-pos-cancelamento.repository';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';

export interface ProcessarEscolhasExpiradasOutput {
  processadas: number;
}

/**
 * Cobre cancelamento-de-sorteio.feature: "Comprador não se manifesta dentro
 * do prazo definido" — executado periodicamente (ver agendamento na camada
 * de infrastructure).
 */
@Injectable()
export class ProcessarEscolhasExpiradasUseCase {
  constructor(
    @Inject(ESCOLHA_POS_CANCELAMENTO_REPOSITORY)
    private readonly escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
  ) {}

  async executar(agora: Date = new Date()): Promise<ProcessarEscolhasExpiradasOutput> {
    const expiradas = await this.escolhaPosCancelamentoRepository.listarPendentesExpiradas(agora);

    for (const escolha of expiradas) {
      escolha.expirarParaCashback(agora);
      await this.escolhaPosCancelamentoRepository.salvar(escolha);

      const comprador = await this.compradorRepository.buscarPorId(escolha.compradorId);
      if (comprador) {
        comprador.creditarCashback(escolha.valorTotal);
        await this.compradorRepository.salvar(comprador);
      }
    }

    return { processadas: expiradas.length };
  }
}

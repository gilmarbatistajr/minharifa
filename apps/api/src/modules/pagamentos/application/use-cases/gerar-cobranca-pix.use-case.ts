import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  COTA_REPOSITORY,
  CotaRepository,
} from '../../../campanhas/domain/repositories/cota.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../../administradores/domain/repositories/administrador.repository';
import {
  PAGAMENTO_REPOSITORY,
  PagamentoRepository,
} from '../../domain/repositories/pagamento.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { gerarPixCopiaECola } from '../../domain/services/gerar-pix-copia-e-cola';
import { resolverCotasElegiveisParaPagamento } from '../services/resolver-cotas-elegiveis-pagamento';

export interface GerarCobrancaPixInput {
  campanhaId: string;
  numerosCotas: number[];
  compradorId: string;
}

export interface GerarCobrancaPixOutput {
  qrCode: string;
  codigoCopiaCola: string;
  valor: number;
  validoAte: Date | null;
}

/**
 * Cobre pagamento-de-cota.feature: "Geração de cobrança via Pix" (a reserva
 * não é tocada se a geração da cobrança falhar). Gera uma única cobrança
 * cobrindo TODAS as cotas reservadas do comprador na campanha — ver
 * `resolverCotasElegiveisParaPagamento`: não é permitido pagar só parte
 * delas. O Pix é gerado localmente (BR Code do Banco Central, ver
 * `gerarPixCopiaECola`) direto para a chave Pix cadastrada na campanha — não
 * passa por nenhum gateway/conta intermediária, então a confirmação do
 * pagamento continua manual, pelo administrador.
 */
@Injectable()
export class GerarCobrancaPixUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
  ) {}

  async executar(input: GerarCobrancaPixInput, agora: Date = new Date()): Promise<GerarCobrancaPixOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha) {
      throw new Error('Campanha não encontrada.');
    }

    if (!campanha.chavePix) {
      throw new Error('Esta campanha ainda não tem uma chave Pix cadastrada.');
    }

    const administrador = await this.administradorRepository.buscarPorId(campanha.administradorId);
    if (!administrador) {
      throw new Error('Administrador da campanha não encontrado.');
    }

    const cotas = await resolverCotasElegiveisParaPagamento(
      this.cotaRepository,
      input.campanhaId,
      input.compradorId,
      input.numerosCotas,
      agora,
    );

    const itens = await Promise.all(
      cotas.map(async (cota) => {
        const pagamentoExistente = await this.pagamentoRepository.buscarPorCotaId(cota.id);
        const valorRestante = pagamentoExistente ? pagamentoExistente.calcularValorRestante() : campanha.valorCota;
        return { cota, pagamentoExistente, valorRestante };
      }),
    );

    const valorTotalRestante = itens.reduce((total, item) => total + item.valorRestante, 0);
    if (valorTotalRestante <= 0) {
      throw new Error('Essas cotas já estão totalmente pagas.');
    }

    const transacaoId = randomUUID();
    const copiaECola = gerarPixCopiaECola({
      chave: campanha.chavePix,
      nomeRecebedor: administrador.nome,
      valor: valorTotalRestante,
      txid: transacaoId,
    });

    for (const item of itens) {
      if (item.pagamentoExistente) {
        item.pagamentoExistente.atualizarCobranca('PIX', transacaoId);
        await this.pagamentoRepository.salvar(item.pagamentoExistente);
      } else {
        const pagamento = new Pagamento(
          randomUUID(),
          item.cota.id,
          input.compradorId,
          campanha.valorCota,
          0,
          'PIX',
          'PENDENTE',
          transacaoId,
          agora,
        );
        await this.pagamentoRepository.criar(pagamento);
      }
    }

    const expiracoes = cotas
      .map((cota) => cota.reservaExpiraEm)
      .filter((data): data is Date => data !== null);
    const validoAte =
      expiracoes.length > 0 ? new Date(Math.min(...expiracoes.map((data) => data.getTime()))) : null;

    return {
      qrCode: copiaECola,
      codigoCopiaCola: copiaECola,
      valor: valorTotalRestante,
      validoAte,
    };
  }
}

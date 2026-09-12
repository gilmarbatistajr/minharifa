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
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';
import {
  ESCOLHA_POS_CANCELAMENTO_REPOSITORY,
  EscolhaPosCancelamentoRepository,
} from '../../domain/repositories/escolha-pos-cancelamento.repository';
import { EscolhaPosCancelamento } from '../../domain/entities/escolha-pos-cancelamento.entity';
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from '../../../../shared/domain/notification-sender';

export interface IniciarCancelamentoSorteioInput {
  sorteioId: string;
  administradorId: string;
}

export interface IniciarCancelamentoSorteioOutput {
  cotasLiberadas: number;
  escolhasGeradas: number;
}

const PRAZO_DECISAO_DIAS = 7;

/**
 * Cobre cancelamento-de-sorteio.feature: "Administrador cancela um sorteio
 * com vendas em andamento" e "Cancelamento libera automaticamente as cotas
 * apenas reservadas".
 */
@Injectable()
export class IniciarCancelamentoSorteioUseCase {
  constructor(
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(ESCOLHA_POS_CANCELAMENTO_REPOSITORY)
    private readonly escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(
    input: IniciarCancelamentoSorteioInput,
    agora: Date = new Date(),
  ): Promise<IniciarCancelamentoSorteioOutput> {
    const sorteio = await this.sorteioRepository.buscarPorId(input.sorteioId);
    if (!sorteio) {
      throw new Error('Sorteio não encontrado.');
    }

    const grupo = await this.grupoRepository.buscarPorId(sorteio.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Sorteio não encontrado.');
    }

    sorteio.cancelar();
    await this.sorteioRepository.salvar(sorteio);

    const cotas = await this.cotaRepository.listarPorSorteio(input.sorteioId);

    let cotasLiberadas = 0;
    const cotasPagasPorComprador = new Map<string, number>();

    for (const cota of cotas) {
      if (cota.status === 'RESERVADA') {
        cota.liberar();
        await this.cotaRepository.salvar(cota);
        cotasLiberadas += 1;
      } else if (cota.status === 'PAGA' && cota.compradorId) {
        cotasPagasPorComprador.set(
          cota.compradorId,
          (cotasPagasPorComprador.get(cota.compradorId) ?? 0) + 1,
        );
      }
    }

    const prazoExpiraEm = new Date(agora.getTime() + PRAZO_DECISAO_DIAS * 24 * 60 * 60_000);

    for (const [compradorId, quantidade] of cotasPagasPorComprador) {
      const escolha = new EscolhaPosCancelamento(
        randomUUID(),
        input.sorteioId,
        compradorId,
        quantidade,
        quantidade * sorteio.valorCota,
        'PENDENTE',
        prazoExpiraEm,
        null,
        agora,
      );
      await this.escolhaPosCancelamentoRepository.criar(escolha);

      const comprador = await this.compradorRepository.buscarPorId(compradorId);
      if (comprador?.email) {
        await this.notificationSender.enviarEmail(
          comprador.email,
          'Sorteio cancelado',
          `O sorteio foi cancelado. Você tem até ${prazoExpiraEm.toISOString()} para escolher entre reembolso ou manter suas cotas no próximo sorteio.`,
        );
      }
    }

    return { cotasLiberadas, escolhasGeradas: cotasPagasPorComprador.size };
  }
}

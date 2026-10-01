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

export interface IniciarCancelamentoCampanhaInput {
  campanhaId: string;
  administradorId: string;
}

export interface IniciarCancelamentoCampanhaOutput {
  cotasLiberadas: number;
  escolhasGeradas: number;
}

const PRAZO_DECISAO_DIAS = 7;

/**
 * Cobre cancelamento-de-sorteio.feature: "Administrador cancela uma campanha
 * com vendas em andamento" e "Cancelamento libera automaticamente as cotas
 * apenas reservadas".
 */
@Injectable()
export class IniciarCancelamentoCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
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
    input: IniciarCancelamentoCampanhaInput,
    agora: Date = new Date(),
  ): Promise<IniciarCancelamentoCampanhaOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha) {
      throw new Error('Campanha não encontrada.');
    }

    const grupo = campanha.grupoId ? await this.grupoRepository.buscarPorId(campanha.grupoId) : null;
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Campanha não encontrada.');
    }

    campanha.cancelar();
    await this.campanhaRepository.salvar(campanha);

    const cotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);

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
        input.campanhaId,
        compradorId,
        quantidade,
        quantidade * campanha.valorCota,
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
          'Campanha cancelada',
          `A campanha foi cancelada. Você tem até ${prazoExpiraEm.toISOString()} para escolher entre reembolso ou manter suas cotas na próxima campanha.`,
        );
      }
    }

    return { cotasLiberadas, escolhasGeradas: cotasPagasPorComprador.size };
  }
}

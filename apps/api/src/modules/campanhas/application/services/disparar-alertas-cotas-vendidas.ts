import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { AgenteChatbotRepository } from '../../../grupos/domain/repositories/agente-chatbot.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { notificarGrupo } from './notificar-grupo';
import { RegistrarMarcosDeVendaUseCase } from '../../../notificacoes/application/use-cases/registrar-marcos-de-venda.use-case';

const LIMIARES_COTAS_VENDIDAS = [50, 80, 90] as const;

/**
 * Depois de qualquer pagamento confirmado (Pix, cartão, cashback, confirmação
 * manual do admin ou resgate de crédito), confere se a campanha cruzou um dos
 * limiares de cotas vendidas (50/80/90%) e, se sim, dispara o aviso do agente
 * chatbot do grupo — uma única vez por campanha por limiar (ver
 * `Campanha.marcarLimiarDeCotasVendidasAlertado`). Não faz nada se a
 * campanha ainda não tiver grupo vinculado; sem agente chatbot ativo, só
 * pula o aviso no grupo (as notificações do painel continuam sendo registradas).
 */
export async function dispararAlertasCotasVendidas(
  campanhaRepository: CampanhaRepository,
  cotaRepository: CotaRepository,
  grupoRepository: GrupoRepository,
  agenteChatbotRepository: AgenteChatbotRepository,
  notificationSender: NotificationSender,
  campanha: Campanha,
  registrarMarcosDeVenda: RegistrarMarcosDeVendaUseCase,
): Promise<void> {
  if (!campanha.grupoId) {
    return;
  }

  const cotas = await cotaRepository.listarPorCampanha(campanha.id);
  if (cotas.length === 0) {
    return;
  }

  const cotasPagas = cotas.filter((cota) => cota.status === 'PAGA').length;
  const percentualVendido = campanha.calcularPercentualVendido(cotasPagas);

  // Notificações do painel (administrador/operador): não dependem do agente chatbot.
  await registrarMarcosDeVenda.executar({
    administradorId: campanha.administradorId,
    campanhaId: campanha.id,
    grupoId: campanha.grupoId,
    nomeCampanha: campanha.nome,
    // O arredondamento de `calcularPercentualVendido` poderia marcar 100% com 1 cota ainda livre.
    percentualVendido: cotasPagas >= campanha.quantidadeCotas ? 100 : Math.min(percentualVendido, 99),
  });

  const limiaresParaAlertar = LIMIARES_COTAS_VENDIDAS.filter(
    (limiar) => percentualVendido >= limiar && !campanha.limiarDeCotasVendidasJaAlertado(limiar),
  );
  if (limiaresParaAlertar.length === 0) {
    return;
  }

  const agente = await agenteChatbotRepository.buscarPorGrupoId(campanha.grupoId);
  if (!agente || !agente.ativo) {
    return;
  }

  for (const limiar of limiaresParaAlertar) {
    campanha.marcarLimiarDeCotasVendidasAlertado(limiar);

    const habilitado =
      limiar === 50
        ? agente.avisa50PorCentoVendido
        : limiar === 80
          ? agente.avisa80PorCentoVendido
          : agente.avisa90PorCentoVendido;
    const mensagem =
      limiar === 50
        ? agente.mensagem50PorCentoVendido
        : limiar === 80
          ? agente.mensagem80PorCentoVendido
          : agente.mensagem90PorCentoVendido;

    if (habilitado && mensagem) {
      await notificarGrupo(grupoRepository, notificationSender, campanha.grupoId, mensagem);
    }
  }

  await campanhaRepository.salvar(campanha);
}

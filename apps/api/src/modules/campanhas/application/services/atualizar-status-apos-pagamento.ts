import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { CotaRepository } from '../../domain/repositories/cota.repository';

/**
 * Cobre a transição automática LIBERADA -> LIBERADA_PARA_SORTEIO: sempre que
 * uma ação de pagamento confirma uma cota como PAGA (Pix, cartão, cashback,
 * confirmação manual do admin ou resgate de crédito), este helper confere se
 * essa foi a última cota em aberto da campanha e, se sim, libera os campos
 * de vencedor na tela do administrador. Chamado no fim de cada use-case que
 * pode deixar uma campanha 100% paga — não faz nada se a campanha não
 * estiver mais em LIBERADA (idempotente) ou se ainda restar cota não paga.
 */
export async function atualizarStatusCampanhaAposPagamento(
  campanhaRepository: CampanhaRepository,
  cotaRepository: CotaRepository,
  campanha: Campanha,
): Promise<void> {
  if (campanha.status !== 'LIBERADA') {
    return;
  }

  const cotas = await cotaRepository.listarPorCampanha(campanha.id);
  const todasPagas = cotas.length > 0 && cotas.every((cota) => cota.status === 'PAGA');
  if (!todasPagas) {
    return;
  }

  campanha.liberarParaSorteio();
  await campanhaRepository.salvar(campanha);
}

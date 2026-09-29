import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';

/**
 * Único jeito realista de "avisar o grupo": a API oficial do WhatsApp não
 * permite postar dentro de um grupo a partir de um link de convite ou de
 * qualquer outro identificador (ver WhatsAppCloudApiNotificationSender), só
 * enviar 1:1 para um número de telefone. Por isso o aviso é replicado para o
 * telefone de cada comprador cadastrado naquele grupo. Falha ao enviar para
 * um comprador não derruba os demais nem a operação que disparou o aviso.
 */
export async function notificarGrupo(
  grupoRepository: GrupoRepository,
  notificationSender: NotificationSender,
  grupoId: string,
  mensagem: string,
): Promise<void> {
  const compradores = await grupoRepository.listarCompradores(grupoId);

  await Promise.allSettled(
    compradores.map((comprador) => notificationSender.enviarWhatsapp(comprador.telefone, mensagem)),
  );
}

import { Injectable, Logger } from '@nestjs/common';
import { NotificationSender } from '../domain/notification-sender';

/**
 * Implementação de sandbox: registra a notificação no log em vez de enviar
 * de fato. Trocar por um adapter real (Resend, WhatsApp Business API) em
 * produção sem alterar nenhum caso de uso, pois eles dependem só da porta.
 */
@Injectable()
export class ConsoleNotificationSender implements NotificationSender {
  private readonly logger = new Logger(ConsoleNotificationSender.name);

  async enviarEmail(destinatario: string, assunto: string, mensagem: string): Promise<void> {
    this.logger.log(`[email sandbox] para=${destinatario} assunto="${assunto}" mensagem="${mensagem}"`);
  }
}

/**
 * Porta do domínio para envio de notificações (e-mail transacional, avisos
 * de chatbot). Implementação concreta (Resend, WhatsApp Business API) fica
 * na camada de infrastructure.
 */
export interface NotificationSender {
  enviarEmail(destinatario: string, assunto: string, mensagem: string): Promise<void>;
}

export const NOTIFICATION_SENDER = Symbol('NOTIFICATION_SENDER');

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationSender } from '../domain/notification-sender';

const VERSAO_GRAPH_API = 'v21.0';
const DDI_BRASIL = '55';

/**
 * Normaliza um telefone (com máscara, com ou sem DDI) para o formato que a
 * Cloud API espera no campo `to`: apenas dígitos, com código do país,
 * sem `+`. Assume Brasil quando o DDI não foi informado — é a única
 * origem de compradores hoje (grupos de WhatsApp brasileiros).
 */
export function normalizarNumeroWhatsapp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '');

  if (digitos.startsWith(DDI_BRASIL) && digitos.length >= 12) {
    return digitos;
  }

  return `${DDI_BRASIL}${digitos}`;
}

/**
 * Envia mensagens via WhatsApp Cloud API (Meta) — a integração oficial e
 * suportada pelos Termos de Uso do WhatsApp. Importante: fora da janela de
 * 24h de uma conversa iniciada pelo destinatário, o WhatsApp só aceita
 * "template messages" pré-aprovadas pela Meta, não texto livre como este;
 * mensagens proativas (ex: "nova campanha disponível") podem falhar até que
 * um template equivalente seja criado e aprovado no Meta Business Manager.
 *
 * Também não existe, na API oficial, uma forma de postar dentro de um grupo
 * de WhatsApp — por isso o envio é sempre 1:1 para o telefone do comprador.
 *
 * Sem WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID configurados, o envio
 * é pulado com um aviso no log em vez de falhar — comportamento seguro
 * para ambientes de desenvolvimento sem essas credenciais.
 */
@Injectable()
export class WhatsAppCloudApiNotificationSender implements NotificationSender {
  private readonly logger = new Logger(WhatsAppCloudApiNotificationSender.name);

  constructor(private readonly configService: ConfigService) {}

  async enviarEmail(destinatario: string, assunto: string, mensagem: string): Promise<void> {
    this.logger.log(`[email sandbox] para=${destinatario} assunto="${assunto}" mensagem="${mensagem}"`);
  }

  async enviarWhatsapp(telefone: string, mensagem: string): Promise<void> {
    const token = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    if (!token || !phoneNumberId) {
      this.logger.warn(
        `WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID não configurados — mensagem para ${telefone} não enviada.`,
      );
      return;
    }

    const numero = normalizarNumeroWhatsapp(telefone);

    const resposta = await fetch(
      `https://graph.facebook.com/${VERSAO_GRAPH_API}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
          type: 'text',
          text: { preview_url: false, body: mensagem },
        }),
      },
    );

    if (!resposta.ok) {
      const corpoErro = await resposta.text();
      this.logger.error(`Falha ao enviar WhatsApp para ${numero}: ${resposta.status} ${corpoErro}`);
      throw new Error(`Falha ao enviar mensagem via WhatsApp (${resposta.status}).`);
    }
  }
}

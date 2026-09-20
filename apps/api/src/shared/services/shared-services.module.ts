import { Global, Module } from '@nestjs/common';
import { PASSWORD_HASHER } from '../domain/password-hasher';
import { TOKEN_GENERATOR } from '../domain/token-generator';
import { NOTIFICATION_SENDER } from '../domain/notification-sender';
import { IMAGE_STORAGE } from '../domain/image-storage';
import { BcryptPasswordHasher } from '../infrastructure/bcrypt-password-hasher';
import { CryptoTokenGenerator } from '../infrastructure/crypto-token-generator';
import { WhatsAppCloudApiNotificationSender } from '../infrastructure/whatsapp-cloud-api-notification-sender';
import { LocalImageStorage } from '../infrastructure/local-image-storage';

@Global()
@Module({
  providers: [
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
    // Envia WhatsApp de verdade quando WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID
    // estiverem configurados; sem eles, apenas loga — seguro para rodar sem
    // credenciais (dev/test). E-mail continua só logado por enquanto.
    { provide: NOTIFICATION_SENDER, useClass: WhatsAppCloudApiNotificationSender },
    // Disco local por enquanto — trocar por um provider de object storage (S3 etc.)
    // quando o deploy deixar de ter disco persistente.
    { provide: IMAGE_STORAGE, useClass: LocalImageStorage },
  ],
  exports: [PASSWORD_HASHER, TOKEN_GENERATOR, NOTIFICATION_SENDER, IMAGE_STORAGE],
})
export class SharedServicesModule {}

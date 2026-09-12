import { Global, Module } from '@nestjs/common';
import { PASSWORD_HASHER } from '../domain/password-hasher';
import { TOKEN_GENERATOR } from '../domain/token-generator';
import { NOTIFICATION_SENDER } from '../domain/notification-sender';
import { BcryptPasswordHasher } from '../infrastructure/bcrypt-password-hasher';
import { CryptoTokenGenerator } from '../infrastructure/crypto-token-generator';
import { ConsoleNotificationSender } from '../infrastructure/console-notification-sender';

@Global()
@Module({
  providers: [
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
    { provide: NOTIFICATION_SENDER, useClass: ConsoleNotificationSender },
  ],
  exports: [PASSWORD_HASHER, TOKEN_GENERATOR, NOTIFICATION_SENDER],
})
export class SharedServicesModule {}

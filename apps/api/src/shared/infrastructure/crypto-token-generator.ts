import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TokenGenerator } from '../domain/token-generator';

@Injectable()
export class CryptoTokenGenerator implements TokenGenerator {
  gerar(): string {
    return randomBytes(32).toString('hex');
  }
}

import { IsEmail } from 'class-validator';

export class SolicitarTrocaEmailDto {
  @IsEmail()
  novoEmail!: string;
}

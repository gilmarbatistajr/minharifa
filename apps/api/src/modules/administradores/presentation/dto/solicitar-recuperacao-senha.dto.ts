import { IsEmail } from 'class-validator';

export class SolicitarRecuperacaoSenhaDto {
  @IsEmail()
  email!: string;
}

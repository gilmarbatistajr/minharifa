import { IsIn, IsString } from 'class-validator';

export class ConfirmarPagamentoWebhookDto {
  @IsString()
  payloadBruto!: string;

  @IsString()
  assinatura!: string;

  @IsString()
  transacaoId!: string;

  @IsIn(['APROVADO', 'RECUSADO'])
  statusGateway!: 'APROVADO' | 'RECUSADO';
}

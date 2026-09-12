import { ArrayNotEmpty, IsInt, IsUUID } from 'class-validator';

export class ResgatarCreditoDto {
  @IsUUID()
  sorteioDestinoId!: string;

  @ArrayNotEmpty()
  @IsInt({ each: true })
  numerosCotas!: number[];
}

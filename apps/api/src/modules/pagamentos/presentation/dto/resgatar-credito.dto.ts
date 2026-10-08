import { ArrayNotEmpty, IsInt, IsUUID } from 'class-validator';

export class ResgatarCreditoDto {
  @IsUUID()
  campanhaDestinoId!: string;

  @ArrayNotEmpty()
  @IsInt({ each: true })
  numerosCotas!: number[];
}

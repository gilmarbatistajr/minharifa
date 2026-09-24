import { ArrayNotEmpty, IsInt, IsPositive, IsUUID } from 'class-validator';

export class PagarComCashbackDto {
  @IsUUID()
  campanhaId!: string;

  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  numerosCotas!: number[];
}

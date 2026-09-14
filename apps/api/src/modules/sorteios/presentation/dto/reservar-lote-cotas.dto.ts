import { ArrayNotEmpty, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class ReservarLoteCotasDto {
  @IsOptional()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  numeros?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  quantidadeAleatoria?: number;
}

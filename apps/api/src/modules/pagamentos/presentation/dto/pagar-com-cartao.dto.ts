import { ArrayNotEmpty, IsInt, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DadosCartaoDto {
  @IsString()
  numero!: string;

  @IsString()
  validade!: string;

  @IsString()
  cvv!: string;

  @IsString()
  nomeTitular!: string;
}

export class PagarComCartaoDto {
  @IsUUID()
  campanhaId!: string;

  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  numerosCotas!: number[];

  @ValidateNested()
  @Type(() => DadosCartaoDto)
  dadosCartao!: DadosCartaoDto;
}

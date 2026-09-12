import { IsInt, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
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
  sorteioId!: string;

  @IsInt()
  @IsPositive()
  numeroCota!: number;

  @ValidateNested()
  @Type(() => DadosCartaoDto)
  dadosCartao!: DadosCartaoDto;
}

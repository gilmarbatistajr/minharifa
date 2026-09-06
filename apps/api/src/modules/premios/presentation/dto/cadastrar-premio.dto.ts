import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CadastrarPremioDto {
  @IsString()
  nome!: string;

  @IsString()
  descricao!: string;

  @IsString()
  fotoUrl!: string;

  @IsNumber()
  @IsPositive()
  valor!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorOpcaoDinheiro?: number;
}

import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class EditarPremioDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valor?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorOpcaoDinheiro?: number;
}

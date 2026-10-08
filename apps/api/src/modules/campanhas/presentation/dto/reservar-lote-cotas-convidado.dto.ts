import { ArrayNotEmpty, IsEmail, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ReservarLoteCotasConvidadoDto {
  @IsOptional()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  numeros?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  quantidadeAleatoria?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  confirmacaoTelefone?: string;

  @IsOptional()
  @IsString()
  cpf?: string;
}

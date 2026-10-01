import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CadastrarCompradorDto {
  @IsUUID()
  grupoId!: string;

  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  apelido?: string;

  @IsDateString()
  dataNascimento!: string;

  @IsString()
  telefone!: string;

  @IsString()
  cpf!: string;

  @IsString()
  endereco!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;

  @IsBoolean()
  aceitouTermo!: boolean;
}

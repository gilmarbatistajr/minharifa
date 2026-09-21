import { ArrayNotEmpty, IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS, FormaVendaCotas } from '../../domain/entities/campanha.entity';

export class CriarCampanhaDto {
  @IsString()
  nome!: string;

  @IsString()
  descricao!: string;

  @IsString()
  telefoneSuporte!: string;

  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  premioIds!: string[];

  @IsInt()
  @IsPositive()
  quantidadeCotas!: number;

  @IsPositive()
  valorCota!: number;

  @IsIn(['ESCOLHA_NUMERO', 'LOTE_FECHADO'])
  formaVenda!: FormaVendaCotas;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantidadeMinimaPorCompra?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantidadeMaximaPorCompra?: number | null;

  @IsOptional()
  @IsIn(EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS)
  expiracaoReservaMinutos?: number | null;

  @IsOptional()
  @IsBoolean()
  reservaExigeEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  reservaExigeNome?: boolean;

  @IsOptional()
  @IsBoolean()
  reservaExigeTelefone?: boolean;

  @IsOptional()
  @IsBoolean()
  reservaExigeConfirmacaoTelefone?: boolean;
}

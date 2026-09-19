import { ArrayNotEmpty, IsIn, IsInt, IsPositive, IsString, IsUUID } from 'class-validator';
import { FormaVendaCotas } from '../../domain/entities/campanha.entity';

export class CriarCampanhaDto {
  @IsString()
  nome!: string;

  @IsString()
  descricao!: string;

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
}

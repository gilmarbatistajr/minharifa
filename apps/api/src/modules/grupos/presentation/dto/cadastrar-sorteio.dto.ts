import { ArrayNotEmpty, IsDateString, IsInt, IsPositive, IsString, IsUUID } from 'class-validator';

export class CadastrarSorteioDto {
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

  @IsDateString()
  dataAberturaVendas!: string;

  @IsDateString()
  dataEncerramentoVendas!: string;

  @IsDateString()
  dataRealizacao!: string;
}

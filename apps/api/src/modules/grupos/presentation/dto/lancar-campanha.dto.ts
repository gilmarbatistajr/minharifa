import { IsDateString, IsOptional } from 'class-validator';

export class LancarCampanhaDto {
  @IsDateString()
  dataAberturaVendas!: string;

  @IsOptional()
  @IsDateString()
  dataEncerramentoVendas?: string;

  @IsOptional()
  @IsDateString()
  dataRealizacao?: string;
}

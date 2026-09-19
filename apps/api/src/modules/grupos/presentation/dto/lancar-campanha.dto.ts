import { IsDateString } from 'class-validator';

export class LancarCampanhaDto {
  @IsDateString()
  dataAberturaVendas!: string;

  @IsDateString()
  dataEncerramentoVendas!: string;

  @IsDateString()
  dataRealizacao!: string;
}

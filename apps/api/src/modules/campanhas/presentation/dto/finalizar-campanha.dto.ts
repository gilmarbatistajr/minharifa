import { IsInt, IsPositive } from 'class-validator';

export class FinalizarCampanhaDto {
  @IsInt()
  @IsPositive()
  cotaVencedoraNumero!: number;
}

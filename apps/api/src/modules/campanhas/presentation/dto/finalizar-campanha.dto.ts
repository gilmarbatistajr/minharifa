import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class FinalizarCampanhaDto {
  @IsInt()
  @IsPositive()
  cotaVencedoraNumero!: number;

  @IsString()
  @IsNotEmpty()
  vencedorNome!: string;

  @IsString()
  @IsNotEmpty()
  vencedorTelefone!: string;
}

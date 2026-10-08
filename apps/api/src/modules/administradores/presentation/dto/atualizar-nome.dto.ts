import { IsString } from 'class-validator';

export class AtualizarNomeDto {
  @IsString()
  nome!: string;
}

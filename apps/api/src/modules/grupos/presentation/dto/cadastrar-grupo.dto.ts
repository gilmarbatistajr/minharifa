import { IsString } from 'class-validator';

export class CadastrarGrupoDto {
  @IsString()
  nome!: string;

  @IsString()
  identificadorWhatsapp!: string;
}

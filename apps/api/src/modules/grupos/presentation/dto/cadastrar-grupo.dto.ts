import { IsString, IsUrl } from 'class-validator';

export class CadastrarGrupoDto {
  @IsString()
  nome!: string;

  @IsString()
  identificadorWhatsapp!: string;

  @IsUrl()
  linkWhatsapp!: string;
}

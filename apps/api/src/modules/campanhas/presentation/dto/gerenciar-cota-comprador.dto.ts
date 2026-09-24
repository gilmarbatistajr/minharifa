import { IsUUID } from 'class-validator';

export class GerenciarCotaCompradorDto {
  @IsUUID()
  compradorId!: string;
}

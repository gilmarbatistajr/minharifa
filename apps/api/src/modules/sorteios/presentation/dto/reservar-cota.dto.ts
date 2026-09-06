import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class ReservarCotaDto {
  @IsUUID()
  sorteioId!: string;

  @IsInt()
  @IsPositive()
  numero!: number;
}

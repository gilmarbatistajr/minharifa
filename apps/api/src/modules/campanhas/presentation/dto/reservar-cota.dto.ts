import { IsInt, IsPositive } from 'class-validator';

export class ReservarCotaDto {
  @IsInt()
  @IsPositive()
  numero!: number;
}

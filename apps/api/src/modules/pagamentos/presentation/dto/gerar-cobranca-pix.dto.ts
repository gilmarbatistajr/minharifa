import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class GerarCobrancaPixDto {
  @IsUUID()
  campanhaId!: string;

  @IsInt()
  @IsPositive()
  numeroCota!: number;
}

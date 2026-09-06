import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class GerarCobrancaPixDto {
  @IsUUID()
  sorteioId!: string;

  @IsInt()
  @IsPositive()
  numeroCota!: number;
}

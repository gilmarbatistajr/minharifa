import { ArrayNotEmpty, IsInt, IsPositive, IsUUID } from 'class-validator';

export class GerarCobrancaPixConvidadoDto {
  @IsUUID()
  campanhaId!: string;

  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  numerosCotas!: number[];

  @IsUUID()
  tokenReservaConvidado!: string;
}

import { IsUUID, ValidateIf } from 'class-validator';

/**
 * Identifica o lote de cotas reservadas que o administrador quer confirmar
 * ou liberar: por `compradorId` (reserva de quem tem conta) ou por
 * `tokenReservaConvidado` (reserva feita sem login) — exatamente um dos dois.
 */
export class GerenciarCotaCompradorDto {
  @ValidateIf((dto) => !dto.tokenReservaConvidado)
  @IsUUID()
  compradorId?: string;

  @ValidateIf((dto) => !dto.compradorId)
  @IsUUID()
  tokenReservaConvidado?: string;
}

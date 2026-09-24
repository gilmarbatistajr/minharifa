import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';

export interface LiberarCotasReservadasInput {
  administradorId: string;
  campanhaId: string;
  compradorId: string;
}

/**
 * Cobre a liberação manual, pelo administrador, das cotas RESERVADA de um
 * comprador (ex.: desistência informada por fora do sistema). Se houver uma
 * cobrança pendente atrelada a alguma dessas cotas e ela for confirmada
 * depois pelo gateway, o webhook já estorna automaticamente por conta própria
 * (a reserva não é mais válida) — não é preciso mexer no pagamento aqui.
 */
@Injectable()
export class LiberarCotasReservadasUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: LiberarCotasReservadasInput): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotasReservadas = await this.cotaRepository.listarReservadasPorComprador(
      input.campanhaId,
      input.compradorId,
    );

    if (cotasReservadas.length === 0) {
      throw new Error('Este comprador não tem cotas reservadas nesta campanha.');
    }

    for (const cota of cotasReservadas) {
      cota.liberar();
      await this.cotaRepository.salvar(cota);
    }
  }
}

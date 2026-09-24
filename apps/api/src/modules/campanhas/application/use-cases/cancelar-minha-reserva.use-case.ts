import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';

export interface CancelarMinhaReservaInput {
  campanhaId: string;
  grupoId: string;
  compradorId: string;
}

/**
 * Self-service do comprador: cancela as próprias cotas RESERVADA na campanha,
 * devolvendo-as para DISPONIVEL. Se houver uma cobrança Pix pendente atrelada
 * a alguma dessas cotas e ela for confirmada depois pelo gateway, o webhook já
 * estorna automaticamente por conta própria (a reserva não é mais válida).
 */
@Injectable()
export class CancelarMinhaReservaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: CancelarMinhaReservaInput): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.grupoId !== input.grupoId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotasReservadas = await this.cotaRepository.listarReservadasPorComprador(
      input.campanhaId,
      input.compradorId,
    );

    if (cotasReservadas.length === 0) {
      throw new Error('Você não tem cotas reservadas nesta campanha.');
    }

    for (const cota of cotasReservadas) {
      cota.liberar();
      await this.cotaRepository.salvar(cota);
    }
  }
}

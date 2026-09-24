import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { StatusCota } from '../../domain/entities/cota.entity';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../../compradores/domain/repositories/comprador.repository';

export interface ListarCotasParaAdministradorInput {
  administradorId: string;
  campanhaId: string;
}

export interface CotaComComprador {
  numero: number;
  status: StatusCota;
  compradorId: string | null;
  compradorNome: string | null;
  compradorTelefone: string | null;
}

/**
 * Cobre a visão administrativa do mapa de cotas de uma campanha: ao contrário
 * de `ListarCotasDaCampanhaUseCase` (ponto de vista do comprador, que nunca
 * expõe de quem é a cota alheia), aqui o administrador dono da campanha vê
 * nome e telefone de cada comprador para poder confirmar pagamentos
 * recebidos por fora ou liberar reservas manualmente.
 */
@Injectable()
export class ListarCotasParaAdministradorUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
  ) {}

  async executar(input: ListarCotasParaAdministradorInput): Promise<CotaComComprador[]> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    const cotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);

    const idsCompradores = [
      ...new Set(cotas.map((cota) => cota.compradorId).filter((id): id is string => id !== null)),
    ];
    const compradores = await Promise.all(
      idsCompradores.map((id) => this.compradorRepository.buscarPorId(id)),
    );
    const compradorPorId = new Map(
      compradores.filter((comprador) => comprador !== null).map((comprador) => [comprador!.id, comprador!]),
    );

    return cotas
      .sort((a, b) => a.numero - b.numero)
      .map((cota) => {
        const comprador = cota.compradorId ? compradorPorId.get(cota.compradorId) ?? null : null;
        return {
          numero: cota.numero,
          status: cota.status,
          compradorId: cota.compradorId,
          compradorNome: comprador?.nome ?? null,
          compradorTelefone: comprador?.telefone ?? null,
        };
      });
  }
}

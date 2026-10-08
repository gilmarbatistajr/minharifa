import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { StatusCota } from '../../domain/entities/cota.entity';

export interface ListarCotasPublicasCampanhaInput {
  campanhaId: string;
}

export interface CotaResumoPublico {
  numero: number;
  status: StatusCota;
}

/**
 * Variante pública (sem login) de `ListarCotasDaCampanhaUseCase`, para quem
 * abre o Link de Vendas sem conta ainda: mesmo mapa de disponibilidade, mas
 * sem "minhaCota"/"reservaExpiraEm" (não existe uma identidade de comprador
 * pra calcular isso) e, como lá, nunca expõe de quem é cada cota.
 */
@Injectable()
export class ListarCotasPublicasCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
  ) {}

  async executar(input: ListarCotasPublicasCampanhaInput, agora: Date = new Date()): Promise<CotaResumoPublico[]> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || !campanha.grupoId || campanha.estaRemovida()) {
      throw new Error('Campanha não encontrada.');
    }

    const cotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);

    return cotas
      .map((cota) => {
        const reservaExpirada = cota.status === 'RESERVADA' && cota.podeSerReservadaPor(agora);
        return {
          numero: cota.numero,
          status: reservaExpirada ? ('DISPONIVEL' as StatusCota) : cota.status,
        };
      })
      .sort((a, b) => a.numero - b.numero);
  }
}

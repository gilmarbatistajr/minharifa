import { Inject, Injectable } from '@nestjs/common';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';

export interface ReservarCotaInput {
  campanhaId: string;
  grupoId: string;
  numero: number;
  compradorId: string;
}

export interface ReservarCotaOutput {
  cotaId: string;
  reservaExpiraEm: Date;
}

const MINUTOS_EXPIRACAO_PADRAO = 2;

@Injectable()
export class ReservarCotaUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: ReservarCotaInput, agora: Date = new Date()): Promise<ReservarCotaOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.grupoId !== input.grupoId) {
      throw new Error('Campanha não encontrada.');
    }

    const cota = await this.cotaRepository.buscarPorCampanhaENumero(input.campanhaId, input.numero);

    if (!cota) {
      throw new Error(`Cota ${input.numero} não existe nessa campanha.`);
    }

    cota.reservarPara(input.compradorId, agora, MINUTOS_EXPIRACAO_PADRAO);

    await this.cotaRepository.salvar(cota);

    return {
      cotaId: cota.id,
      reservaExpiraEm: cota.reservaExpiraEm as Date,
    };
  }
}

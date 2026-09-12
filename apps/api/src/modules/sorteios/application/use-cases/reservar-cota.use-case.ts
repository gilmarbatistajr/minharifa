import { Inject, Injectable } from '@nestjs/common';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';

export interface ReservarCotaInput {
  sorteioId: string;
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
  ) {}

  async executar(input: ReservarCotaInput, agora: Date = new Date()): Promise<ReservarCotaOutput> {
    const cota = await this.cotaRepository.buscarPorSorteioENumero(input.sorteioId, input.numero);

    if (!cota) {
      throw new Error(`Cota ${input.numero} não existe nesse sorteio.`);
    }

    cota.reservarPara(input.compradorId, agora, MINUTOS_EXPIRACAO_PADRAO);

    await this.cotaRepository.salvar(cota);

    return {
      cotaId: cota.id,
      reservaExpiraEm: cota.reservaExpiraEm as Date,
    };
  }
}

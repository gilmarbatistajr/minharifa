import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Campanha } from '../../domain/entities/campanha.entity';

export interface ListarCampanhasVisiveisParaCompradorInput {
  grupoId: string;
}

/**
 * Cobre acesso-via-convite.feature: "Comprador de um grupo não enxerga
 * campanha de outro grupo" e "...não enxerga campanha de outro grupo do
 * mesmo admin".
 */
@Injectable()
export class ListarCampanhasVisiveisParaCompradorUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: ListarCampanhasVisiveisParaCompradorInput): Promise<Campanha[]> {
    return this.campanhaRepository.listarPorGrupo(input.grupoId);
  }
}

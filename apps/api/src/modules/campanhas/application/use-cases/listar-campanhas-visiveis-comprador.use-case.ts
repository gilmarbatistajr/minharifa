import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Campanha } from '../../domain/entities/campanha.entity';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';

export interface ListarCampanhasVisiveisParaCompradorInput {
  grupoId: string;
}

/** Campanha visível ao comprador, já com o contato de suporte do grupo (a campanha não guarda um telefone próprio). */
export type CampanhaVisivel = Campanha & { telefoneSuporte: string };

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
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
  ) {}

  async executar(input: ListarCampanhasVisiveisParaCompradorInput): Promise<CampanhaVisivel[]> {
    const [campanhas, grupo] = await Promise.all([
      this.campanhaRepository.listarPorGrupo(input.grupoId),
      this.grupoRepository.buscarPorId(input.grupoId),
    ]);
    const telefoneSuporte = grupo?.identificadorWhatsapp ?? '';

    return campanhas.map((campanha) => Object.assign(campanha, { telefoneSuporte }));
  }
}

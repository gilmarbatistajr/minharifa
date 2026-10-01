import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  CAMPANHA_REPOSITORY,
  CampanhaRepository,
} from '../../../campanhas/domain/repositories/campanha.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';

export interface ListarCampanhasDoGrupoInput {
  administradorId: string;
  grupoId: string;
}

/** Cobre meus-grupos.feature: listar as campanhas lançadas para um grupo. */
@Injectable()
export class ListarCampanhasDoGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: ListarCampanhasDoGrupoInput): Promise<Campanha[]> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    return this.campanhaRepository.listarPorGrupo(input.grupoId);
  }
}

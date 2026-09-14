import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';

export interface ListarSorteiosDoGrupoInput {
  administradorId: string;
  grupoId: string;
}

/** Cobre meus-grupos.feature / cadastro-de-sorteio.feature: listar os sorteios de um grupo. */
@Injectable()
export class ListarSorteiosDoGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
  ) {}

  async executar(input: ListarSorteiosDoGrupoInput): Promise<Sorteio[]> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);
    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    return this.sorteioRepository.listarPorGrupo(input.grupoId);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  CompradorResumo,
  GRUPO_REPOSITORY,
  GrupoRepository,
} from '../../domain/repositories/grupo.repository';

export interface ListarCompradoresDoGrupoInput {
  administradorId: string;
  grupoId: string;
}

/** Cobre meus-grupos.feature: "Visualizar lista de compradores de um grupo". */
@Injectable()
export class ListarCompradoresDoGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
  ) {}

  async executar(input: ListarCompradoresDoGrupoInput): Promise<CompradorResumo[]> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    return this.grupoRepository.listarCompradores(input.grupoId);
  }
}

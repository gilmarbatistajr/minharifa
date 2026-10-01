import { Inject, Injectable } from '@nestjs/common';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Grupo } from '../../domain/entities/grupo.entity';

export interface ListarGruposDoAdministradorInput {
  administradorId: string;
}

/** Cobre meus-grupos.feature: listagem dos grupos do administrador autenticado. */
@Injectable()
export class ListarGruposDoAdministradorUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
  ) {}

  async executar(input: ListarGruposDoAdministradorInput): Promise<Grupo[]> {
    return this.grupoRepository.listarPorAdministrador(input.administradorId);
  }
}

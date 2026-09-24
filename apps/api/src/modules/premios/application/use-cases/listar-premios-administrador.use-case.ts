import { Inject, Injectable } from '@nestjs/common';
import { PREMIO_REPOSITORY, PremioRepository } from '../../domain/repositories/premio.repository';
import { Premio } from '../../domain/entities/premio.entity';

export interface ListarPremiosDoAdministradorInput {
  administradorId: string;
}

/** Cobre cadastro-de-premio.feature: listagem dos prêmios do administrador autenticado. */
@Injectable()
export class ListarPremiosDoAdministradorUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
  ) {}

  async executar(input: ListarPremiosDoAdministradorInput): Promise<Premio[]> {
    return this.premioRepository.listarPorAdministrador(input.administradorId);
  }
}

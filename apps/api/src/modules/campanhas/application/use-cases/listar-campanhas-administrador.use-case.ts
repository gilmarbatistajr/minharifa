import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Campanha } from '../../domain/entities/campanha.entity';

export interface ListarCampanhasDoAdministradorInput {
  administradorId: string;
}

/** Alimenta o menu "Campanhas": todas as campanhas do administrador, lançadas ou não. */
@Injectable()
export class ListarCampanhasDoAdministradorUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: ListarCampanhasDoAdministradorInput): Promise<Campanha[]> {
    return this.campanhaRepository.listarPorAdministrador(input.administradorId);
  }
}

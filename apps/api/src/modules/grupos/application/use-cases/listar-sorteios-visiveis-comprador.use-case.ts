import { Inject, Injectable } from '@nestjs/common';
import {
  SORTEIO_REPOSITORY,
  SorteioRepository,
} from '../../../sorteios/domain/repositories/sorteio.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';

export interface ListarSorteiosVisiveisParaCompradorInput {
  grupoId: string;
}

/**
 * Cobre acesso-via-convite.feature: isolamento multi-tenant — um comprador
 * só enxerga sorteios do próprio grupo, nunca de outro grupo (mesmo que do
 * mesmo administrador). A consulta é sempre restrita ao grupoId do token do
 * comprador autenticado, nunca a um grupoId arbitrário informado por ele.
 */
@Injectable()
export class ListarSorteiosVisiveisParaCompradorUseCase {
  constructor(
    @Inject(SORTEIO_REPOSITORY)
    private readonly sorteioRepository: SorteioRepository,
  ) {}

  async executar(input: ListarSorteiosVisiveisParaCompradorInput): Promise<Sorteio[]> {
    return this.sorteioRepository.listarPorGrupo(input.grupoId);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../domain/repositories/operador.repository';
import { OperadorResumo, paraResumo } from './listar-operadores-administrador.use-case';

export interface BuscarOperadorInput {
  administradorId: string;
  operadorId: string;
}

/** Alimenta o pré-preenchimento do formulário de edição do operador. */
@Injectable()
export class BuscarOperadorUseCase {
  constructor(
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
  ) {}

  async executar(input: BuscarOperadorInput): Promise<OperadorResumo> {
    const operador = await this.operadorRepository.buscarPorId(input.operadorId);

    if (!operador || !operador.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Operador não encontrado.');
    }

    return paraResumo(operador);
  }
}

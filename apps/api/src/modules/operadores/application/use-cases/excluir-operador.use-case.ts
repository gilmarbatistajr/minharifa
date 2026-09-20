import { Inject, Injectable } from '@nestjs/common';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../domain/repositories/operador.repository';

export interface ExcluirOperadorInput {
  administradorId: string;
  operadorId: string;
}

/** Cobre cadastro-de-operador.feature: exclusão de um operador pelo administrador dono. */
@Injectable()
export class ExcluirOperadorUseCase {
  constructor(
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
  ) {}

  async executar(input: ExcluirOperadorInput): Promise<void> {
    const operador = await this.operadorRepository.buscarPorId(input.operadorId);

    if (!operador || !operador.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Operador não encontrado.');
    }

    await this.operadorRepository.remover(operador.id);
  }
}

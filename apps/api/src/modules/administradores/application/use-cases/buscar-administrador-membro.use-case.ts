import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { AdministradorMembroResumo, paraResumoMembro } from './listar-administradores-membros.use-case';

export interface BuscarAdministradorMembroInput {
  administradorId: string;
  membroId: string;
}

/** Alimenta o pré-preenchimento do formulário de edição do administrador membro. */
@Injectable()
export class BuscarAdministradorMembroUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(input: BuscarAdministradorMembroInput): Promise<AdministradorMembroResumo> {
    const solicitante = await this.administradorRepository.buscarPorId(input.administradorId);
    const membro = await this.administradorRepository.buscarPorId(input.membroId);

    if (!solicitante || !membro || !membro.ehMembro() || !membro.pertenceAMesmaConta(solicitante.contaId())) {
      throw new Error('Administrador não encontrado.');
    }

    return paraResumoMembro(membro);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  LINK_CONVITE_REPOSITORY,
  LinkConviteRepository,
} from '../../domain/repositories/link-convite.repository';

export interface ValidarCodigoConviteInput {
  codigo: string;
}

export interface ValidarCodigoConviteOutput {
  grupoId: string;
}

/**
 * Cobre acesso-via-convite.feature: "Cadastro de comprador via link válido",
 * "Código de convite inexistente" e "Código de convite revogado".
 */
@Injectable()
export class ValidarCodigoConviteUseCase {
  constructor(
    @Inject(LINK_CONVITE_REPOSITORY)
    private readonly linkConviteRepository: LinkConviteRepository,
  ) {}

  async executar(input: ValidarCodigoConviteInput): Promise<ValidarCodigoConviteOutput> {
    const linkConvite = await this.linkConviteRepository.buscarPorCodigo(input.codigo);

    if (!linkConvite) {
      throw new Error('Código de convite inválido.');
    }

    if (!linkConvite.estaValido()) {
      throw new Error('Este link de convite foi revogado.');
    }

    return { grupoId: linkConvite.grupoId };
  }
}

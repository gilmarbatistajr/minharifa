import { Inject, Injectable } from '@nestjs/common';
import {
  LINK_CONVITE_REPOSITORY,
  LinkConviteRepository,
} from '../../domain/repositories/link-convite.repository';

export interface RevogarLinkConviteInput {
  linkConviteId: string;
}

@Injectable()
export class RevogarLinkConviteUseCase {
  constructor(
    @Inject(LINK_CONVITE_REPOSITORY)
    private readonly linkConviteRepository: LinkConviteRepository,
  ) {}

  async executar(input: RevogarLinkConviteInput): Promise<void> {
    const linkConvite = await this.linkConviteRepository.buscarPorId(input.linkConviteId);

    if (!linkConvite) {
      throw new Error('Link de convite não encontrado.');
    }

    linkConvite.revogar();

    await this.linkConviteRepository.salvar(linkConvite);
  }
}

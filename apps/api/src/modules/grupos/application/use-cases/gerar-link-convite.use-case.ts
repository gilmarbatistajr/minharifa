import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import {
  LINK_CONVITE_REPOSITORY,
  LinkConviteRepository,
} from '../../domain/repositories/link-convite.repository';
import { LinkConvite } from '../../domain/entities/link-convite.entity';
import { TOKEN_GENERATOR, TokenGenerator } from '../../../../shared/domain/token-generator';

const TAMANHO_CODIGO = 10;

export interface GerarLinkConviteInput {
  administradorId: string;
  grupoId: string;
}

export interface GerarLinkConviteOutput {
  codigo: string;
}

/** Cobre acesso-via-convite.feature: "Gerar link de convite para um grupo". */
@Injectable()
export class GerarLinkConviteUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(LINK_CONVITE_REPOSITORY)
    private readonly linkConviteRepository: LinkConviteRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async executar(input: GerarLinkConviteInput, agora: Date = new Date()): Promise<GerarLinkConviteOutput> {
    const grupo = await this.grupoRepository.buscarPorId(input.grupoId);

    if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Grupo não encontrado.');
    }

    const codigo = this.tokenGenerator.gerar().slice(0, TAMANHO_CODIGO);

    const linkConvite = new LinkConvite(randomUUID(), input.grupoId, codigo, 'ATIVO', agora);

    await this.linkConviteRepository.criar(linkConvite);

    return { codigo: linkConvite.codigo };
  }
}

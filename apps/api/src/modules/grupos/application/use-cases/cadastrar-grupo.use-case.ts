import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Grupo } from '../../domain/entities/grupo.entity';
import {
  LINK_CONVITE_REPOSITORY,
  LinkConviteRepository,
} from '../../domain/repositories/link-convite.repository';
import { LinkConvite } from '../../domain/entities/link-convite.entity';
import { TOKEN_GENERATOR, TokenGenerator } from '../../../../shared/domain/token-generator';

const TAMANHO_CODIGO_CONVITE = 10;

export interface CadastrarGrupoInput {
  administradorId: string;
  nome: string;
  identificadorWhatsapp: string;
  linkWhatsapp: string;
}

export interface CadastrarGrupoOutput {
  grupoId: string;
  codigoConvite: string;
}

/**
 * Cobre meus-grupos.feature: "Cadastrar novo grupo" e a rejeição de
 * "cadastrar grupo WhatsApp já vinculado a outro admin". O link de convite
 * já nasce pronto junto com o grupo — não é mais um passo manual separado
 * (ver `GerarLinkConviteUseCase`, que continua existindo para gerar um novo
 * link caso o admin precise substituir o atual).
 */
@Injectable()
export class CadastrarGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(LINK_CONVITE_REPOSITORY)
    private readonly linkConviteRepository: LinkConviteRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async executar(input: CadastrarGrupoInput, agora: Date = new Date()): Promise<CadastrarGrupoOutput> {
    const existente = await this.grupoRepository.buscarPorIdentificadorWhatsapp(
      input.identificadorWhatsapp,
    );

    if (existente) {
      throw new Error('Este grupo do WhatsApp já está vinculado a outro administrador.');
    }

    const grupo = new Grupo(
      randomUUID(),
      input.administradorId,
      input.nome,
      input.identificadorWhatsapp,
      agora,
      input.linkWhatsapp,
    );

    await this.grupoRepository.criar(grupo);

    const codigo = this.tokenGenerator.gerar().slice(0, TAMANHO_CODIGO_CONVITE);
    const linkConvite = new LinkConvite(randomUUID(), grupo.id, codigo, 'ATIVO', agora);
    await this.linkConviteRepository.criar(linkConvite);

    return { grupoId: grupo.id, codigoConvite: linkConvite.codigo };
  }
}

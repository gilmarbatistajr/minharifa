import { LinkConvite } from '../entities/link-convite.entity';

export interface LinkConviteRepository {
  buscarPorId(id: string): Promise<LinkConvite | null>;
  buscarPorCodigo(codigo: string): Promise<LinkConvite | null>;
  criar(linkConvite: LinkConvite): Promise<void>;
  salvar(linkConvite: LinkConvite): Promise<void>;
}

export const LINK_CONVITE_REPOSITORY = Symbol('LINK_CONVITE_REPOSITORY');

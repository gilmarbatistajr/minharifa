import { Campanha } from '../entities/campanha.entity';

/**
 * Porta do domínio para persistência de campanhas. A implementação concreta
 * (Prisma) fica na camada de infrastructure.
 */
export interface CampanhaRepository {
  buscarPorId(id: string): Promise<Campanha | null>;
  listarPorPremioId(premioId: string): Promise<Campanha[]>;
  listarPorGrupo(grupoId: string): Promise<Campanha[]>;
  listarPorAdministrador(administradorId: string): Promise<Campanha[]>;
  criar(campanha: Campanha): Promise<void>;
  salvar(campanha: Campanha): Promise<void>;
}

export const CAMPANHA_REPOSITORY = Symbol('CAMPANHA_REPOSITORY');

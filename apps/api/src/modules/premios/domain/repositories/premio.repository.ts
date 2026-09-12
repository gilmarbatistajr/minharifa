import { Premio } from '../entities/premio.entity';

export interface PremioRepository {
  buscarPorId(id: string): Promise<Premio | null>;
  listarPorAdministrador(administradorId: string): Promise<Premio[]>;
  criar(premio: Premio): Promise<void>;
  salvar(premio: Premio): Promise<void>;
}

export const PREMIO_REPOSITORY = Symbol('PREMIO_REPOSITORY');

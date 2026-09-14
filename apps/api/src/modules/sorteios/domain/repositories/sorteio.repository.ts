import { Sorteio } from '../entities/sorteio.entity';

/**
 * Porta do domínio para persistência de sorteios. A implementação concreta
 * (Prisma) fica na camada de infrastructure.
 */
export interface SorteioRepository {
  buscarPorId(id: string): Promise<Sorteio | null>;
  listarPorPremioId(premioId: string): Promise<Sorteio[]>;
  listarPorGrupo(grupoId: string): Promise<Sorteio[]>;
  listarPorAdministrador(administradorId: string): Promise<Sorteio[]>;
  criar(sorteio: Sorteio): Promise<void>;
  salvar(sorteio: Sorteio): Promise<void>;
}

export const SORTEIO_REPOSITORY = Symbol('SORTEIO_REPOSITORY');

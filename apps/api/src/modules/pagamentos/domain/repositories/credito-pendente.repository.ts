import { CreditoPendente } from '../entities/credito-pendente.entity';

export interface CreditoPendenteRepository {
  buscarPorId(id: string): Promise<CreditoPendente | null>;
  criar(credito: CreditoPendente): Promise<void>;
  salvar(credito: CreditoPendente): Promise<void>;
}

export const CREDITO_PENDENTE_REPOSITORY = Symbol('CREDITO_PENDENTE_REPOSITORY');

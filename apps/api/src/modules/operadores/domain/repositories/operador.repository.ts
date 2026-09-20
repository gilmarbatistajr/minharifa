import { Operador } from '../entities/operador.entity';

export interface OperadorRepository {
  buscarPorId(id: string): Promise<Operador | null>;
  buscarPorLogin(login: string): Promise<Operador | null>;
  buscarPorCpf(cpf: string): Promise<Operador | null>;
  listarPorAdministrador(administradorId: string): Promise<Operador[]>;
  criar(operador: Operador): Promise<void>;
  salvar(operador: Operador): Promise<void>;
  remover(id: string): Promise<void>;
}

export const OPERADOR_REPOSITORY = Symbol('OPERADOR_REPOSITORY');

import { Comprador } from '../entities/comprador.entity';

export interface CompradorRepository {
  buscarPorId(id: string): Promise<Comprador | null>;
  buscarPorCpf(cpf: string): Promise<Comprador | null>;
  buscarPorEmail(email: string): Promise<Comprador | null>;
  buscarPorTokenRecuperacaoSenha(token: string): Promise<Comprador | null>;
  salvar(comprador: Comprador): Promise<void>;
  criar(comprador: Comprador): Promise<void>;
}

export const COMPRADOR_REPOSITORY = Symbol('COMPRADOR_REPOSITORY');

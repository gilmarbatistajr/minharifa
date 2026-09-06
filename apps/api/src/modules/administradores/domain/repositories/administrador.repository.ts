import { Administrador } from '../entities/administrador.entity';

/**
 * Porta do domínio para persistência de administradores. A implementação
 * concreta (Prisma) fica na camada de infrastructure.
 */
export interface AdministradorRepository {
  buscarPorId(id: string): Promise<Administrador | null>;
  buscarPorEmail(email: string): Promise<Administrador | null>;
  buscarPorTokenConfirmacaoEmail(token: string): Promise<Administrador | null>;
  buscarPorTokenRecuperacaoSenha(token: string): Promise<Administrador | null>;
  buscarPorTokenConfirmacaoNovoEmail(token: string): Promise<Administrador | null>;
  salvar(administrador: Administrador): Promise<void>;
  criar(administrador: Administrador): Promise<void>;
}

export const ADMINISTRADOR_REPOSITORY = Symbol('ADMINISTRADOR_REPOSITORY');

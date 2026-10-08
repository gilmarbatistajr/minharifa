import { Grupo } from '../entities/grupo.entity';

export interface CompradorResumo {
  id: string;
  nome: string;
  telefone: string;
}

export interface GrupoRepository {
  buscarPorId(id: string): Promise<Grupo | null>;
  buscarPorIdentificadorWhatsapp(identificadorWhatsapp: string): Promise<Grupo | null>;
  listarPorAdministrador(administradorId: string): Promise<Grupo[]>;
  listarCompradores(grupoId: string): Promise<CompradorResumo[]>;
  criar(grupo: Grupo): Promise<void>;
}

export const GRUPO_REPOSITORY = Symbol('GRUPO_REPOSITORY');

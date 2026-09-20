import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { Administrador, PermissaoRecurso } from '../../domain/entities/administrador.entity';

export interface ListarAdministradoresMembrosInput {
  administradorId: string;
}

/** Nunca inclui senhaHash — alimenta a tela de gestão de administradores do dono da conta. */
export interface AdministradorMembroResumo {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  rg: string | null;
  permissoes: PermissaoRecurso[];
  criadoEm: Date;
}

export function paraResumoMembro(administrador: Administrador): AdministradorMembroResumo {
  return {
    id: administrador.id,
    nome: administrador.nome,
    email: administrador.email,
    telefone: administrador.telefone,
    cpf: administrador.cpf,
    rg: administrador.rg,
    permissoes: administrador.permissoes,
    criadoEm: administrador.criadoEm,
  };
}

/** Cobre cadastro-de-administrador-membro.feature: listagem dos membros da conta do dono. */
@Injectable()
export class ListarAdministradoresMembrosUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(input: ListarAdministradoresMembrosInput): Promise<AdministradorMembroResumo[]> {
    const solicitante = await this.administradorRepository.buscarPorId(input.administradorId);

    if (!solicitante) {
      throw new Error('Administrador não encontrado.');
    }

    const membros = await this.administradorRepository.listarMembrosDaConta(solicitante.contaId());

    return membros.map(paraResumoMembro);
  }
}

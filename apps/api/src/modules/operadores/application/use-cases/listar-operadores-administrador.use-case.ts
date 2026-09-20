import { Inject, Injectable } from '@nestjs/common';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../domain/repositories/operador.repository';
import { Operador, PermissaoRecursoOperador } from '../../domain/entities/operador.entity';

export interface ListarOperadoresDoAdministradorInput {
  administradorId: string;
}

/** Nunca inclui senhaHash — a listagem alimenta a tela de gestão de operadores do admin. */
export interface OperadorResumo {
  id: string;
  nomeCompleto: string;
  endereco: string;
  cpf: string;
  rg: string;
  telefone: string;
  login: string;
  grupoIds: string[];
  permissoes: PermissaoRecursoOperador[];
  criadoEm: Date;
}

export function paraResumo(operador: Operador): OperadorResumo {
  return {
    id: operador.id,
    nomeCompleto: operador.nomeCompleto,
    endereco: operador.endereco,
    cpf: operador.cpf,
    rg: operador.rg,
    telefone: operador.telefone,
    login: operador.login,
    grupoIds: operador.grupoIds,
    permissoes: operador.permissoes,
    criadoEm: operador.criadoEm,
  };
}

@Injectable()
export class ListarOperadoresDoAdministradorUseCase {
  constructor(
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
  ) {}

  async executar(input: ListarOperadoresDoAdministradorInput): Promise<OperadorResumo[]> {
    const operadores = await this.operadorRepository.listarPorAdministrador(input.administradorId);
    return operadores.map(paraResumo);
  }
}

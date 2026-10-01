import { Inject, Injectable } from '@nestjs/common';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../domain/repositories/operador.repository';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { validarTelefone } from '../../../compradores/domain/services/validacoes-comprador';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';
import { PermissaoRecursoOperador } from '../../domain/entities/operador.entity';

export interface EditarOperadorInput {
  administradorId: string;
  operadorId: string;
  nomeCompleto?: string;
  endereco?: string;
  rg?: string;
  telefone?: string;
  login?: string;
  senha?: string;
  grupoIds?: string[];
  permissoes?: PermissaoRecursoOperador[];
}

/**
 * Cobre cadastro-de-operador.feature: edição de dados cadastrais, troca de
 * senha opcional e reassociação a outro conjunto de grupos.
 */
@Injectable()
export class EditarOperadorUseCase {
  constructor(
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(input: EditarOperadorInput): Promise<void> {
    const operador = await this.operadorRepository.buscarPorId(input.operadorId);

    if (!operador || !operador.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Operador não encontrado.');
    }

    if (input.telefone !== undefined && !validarTelefone(input.telefone)) {
      throw new Error('Telefone inválido.');
    }

    if (input.login !== undefined && input.login !== operador.login) {
      const existentePorLogin = await this.operadorRepository.buscarPorLogin(input.login);
      if (existentePorLogin) {
        throw new Error('Este login já está em uso.');
      }
    }

    if (input.grupoIds !== undefined) {
      if (input.grupoIds.length === 0) {
        throw new Error('Selecione ao menos um grupo para o operador.');
      }
      for (const grupoId of input.grupoIds) {
        const grupo = await this.grupoRepository.buscarPorId(grupoId);
        if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
          throw new Error('Um dos grupos selecionados não foi encontrado.');
        }
      }
    }

    operador.atualizar({
      nomeCompleto: input.nomeCompleto,
      endereco: input.endereco,
      rg: input.rg,
      telefone: input.telefone,
      login: input.login,
      grupoIds: input.grupoIds,
      permissoes: input.permissoes,
    });

    if (input.senha !== undefined) {
      if (input.senha.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }
      operador.trocarSenha(await this.passwordHasher.hash(input.senha));
    }

    await this.operadorRepository.salvar(operador);
  }
}

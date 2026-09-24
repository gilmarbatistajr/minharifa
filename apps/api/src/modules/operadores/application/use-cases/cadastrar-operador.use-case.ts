import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OPERADOR_REPOSITORY, OperadorRepository } from '../../domain/repositories/operador.repository';
import { Operador, PermissaoRecursoOperador } from '../../domain/entities/operador.entity';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { validarCpf, validarTelefone } from '../../../compradores/domain/services/validacoes-comprador';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';

export interface CadastrarOperadorInput {
  administradorId: string;
  nomeCompleto: string;
  endereco: string;
  cpf: string;
  rg: string;
  telefone: string;
  login: string;
  senha: string;
  grupoIds: string[];
  permissoes: PermissaoRecursoOperador[];
}

export interface CadastrarOperadorOutput {
  operadorId: string;
}

/**
 * Cobre cadastro-de-operador.feature: cadastro válido associado a um ou mais
 * grupos, CPF inválido/duplicado, login duplicado e grupo que não pertence
 * ao administrador.
 */
@Injectable()
export class CadastrarOperadorUseCase {
  constructor(
    @Inject(OPERADOR_REPOSITORY)
    private readonly operadorRepository: OperadorRepository,
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(input: CadastrarOperadorInput, agora: Date = new Date()): Promise<CadastrarOperadorOutput> {
    if (!input.nomeCompleto.trim()) {
      throw new Error('Nome completo é obrigatório.');
    }

    if (!validarCpf(input.cpf)) {
      throw new Error('CPF inválido.');
    }

    if (!validarTelefone(input.telefone)) {
      throw new Error('Telefone inválido.');
    }

    if (!input.login.trim()) {
      throw new Error('Login é obrigatório.');
    }

    if (input.senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    if (input.grupoIds.length === 0) {
      throw new Error('Selecione ao menos um grupo para o operador.');
    }

    const cpfDigitos = input.cpf.replace(/\D/g, '');
    const existentePorCpf = await this.operadorRepository.buscarPorCpf(cpfDigitos);
    if (existentePorCpf) {
      throw new Error('Este CPF já está cadastrado.');
    }

    const existentePorLogin = await this.operadorRepository.buscarPorLogin(input.login);
    if (existentePorLogin) {
      throw new Error('Este login já está em uso.');
    }

    for (const grupoId of input.grupoIds) {
      const grupo = await this.grupoRepository.buscarPorId(grupoId);
      if (!grupo || !grupo.pertenceAoAdministrador(input.administradorId)) {
        throw new Error('Um dos grupos selecionados não foi encontrado.');
      }
    }

    const senhaHash = await this.passwordHasher.hash(input.senha);

    const operador = new Operador(
      randomUUID(),
      input.administradorId,
      input.nomeCompleto,
      input.endereco,
      cpfDigitos,
      input.rg,
      input.telefone,
      input.login,
      senhaHash,
      input.grupoIds,
      agora,
      input.permissoes,
    );

    await this.operadorRepository.criar(operador);

    return { operadorId: operador.id };
  }
}

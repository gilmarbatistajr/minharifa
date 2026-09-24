import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { Administrador, PermissaoRecurso } from '../../domain/entities/administrador.entity';
import { validarCpf, validarTelefone } from '../../../compradores/domain/services/validacoes-comprador';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';

export interface CadastrarAdministradorMembroInput {
  administradorId: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  rg: string;
  senha: string;
  permissoes: PermissaoRecurso[];
}

export interface CadastrarAdministradorMembroOutput {
  membroId: string;
}

/**
 * Cobre cadastro-de-administrador-membro.feature: o dono da conta cadastra um
 * administrador adicional, com dados pessoais e permissões por seção do menu.
 * O membro nasce com o e-mail já confirmado (foi o dono quem o cadastrou).
 */
@Injectable()
export class CadastrarAdministradorMembroUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(
    input: CadastrarAdministradorMembroInput,
    agora: Date = new Date(),
  ): Promise<CadastrarAdministradorMembroOutput> {
    const solicitante = await this.administradorRepository.buscarPorId(input.administradorId);
    if (!solicitante) {
      throw new Error('Administrador não encontrado.');
    }

    if (!input.nome.trim()) {
      throw new Error('Nome completo é obrigatório.');
    }

    if (!validarCpf(input.cpf)) {
      throw new Error('CPF inválido.');
    }

    if (!validarTelefone(input.telefone)) {
      throw new Error('Telefone inválido.');
    }

    if (input.senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    const emailExistente = await this.administradorRepository.buscarPorEmail(input.email);
    if (emailExistente) {
      throw new Error('Este e-mail já está em uso.');
    }

    const cpfDigitos = input.cpf.replace(/\D/g, '');
    const cpfExistente = await this.administradorRepository.buscarPorCpf(cpfDigitos);
    if (cpfExistente) {
      throw new Error('Este CPF já está cadastrado.');
    }

    const senhaHash = await this.passwordHasher.hash(input.senha);

    const membro = new Administrador(
      randomUUID(),
      input.nome,
      input.email,
      senhaHash,
      true,
      agora,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      input.telefone,
      cpfDigitos,
      input.rg,
      solicitante.contaId(),
      input.permissoes,
    );

    await this.administradorRepository.criar(membro);

    return { membroId: membro.id };
  }
}

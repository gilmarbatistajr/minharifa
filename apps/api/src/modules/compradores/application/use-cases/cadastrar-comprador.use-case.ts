import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../domain/repositories/comprador.repository';
import { Comprador } from '../../domain/entities/comprador.entity';
import { validarCpf, validarTelefone, calcularIdadeEm } from '../../domain/services/validacoes-comprador';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';

export interface CadastrarCompradorInput {
  grupoId: string;
  nome: string;
  apelido?: string;
  dataNascimento: Date;
  telefone: string;
  cpf: string;
  endereco: string;
  email?: string;
  senha?: string;
  aceitouTermo: boolean;
}

export interface CadastrarCompradorOutput {
  compradorId: string;
}

// A validação segue o IDADE_MINIMA=18 documentado em .env.example.
const IDADE_MINIMA = 18;

/**
 * Cobre cadastro-de-comprador.feature: cadastro válido, CPF inválido/duplicado,
 * telefone inválido, menor de idade, maior de idade no limite exato e a
 * exigência de aceite do termo de consentimento.
 */
@Injectable()
export class CadastrarCompradorUseCase {
  constructor(
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async executar(
    input: CadastrarCompradorInput,
    agora: Date = new Date(),
  ): Promise<CadastrarCompradorOutput> {
    if (!input.aceitouTermo) {
      throw new Error('É necessário aceitar o termo de consentimento para continuar.');
    }

    if (!validarCpf(input.cpf)) {
      throw new Error('CPF inválido.');
    }

    if (!validarTelefone(input.telefone)) {
      throw new Error('Telefone inválido.');
    }

    if (calcularIdadeEm(input.dataNascimento, agora) < IDADE_MINIMA) {
      throw new Error('É necessário ter 18 anos ou mais para participar.');
    }

    const cpfDigitos = input.cpf.replace(/\D/g, '');
    const existentePorCpf = await this.compradorRepository.buscarPorCpf(cpfDigitos);
    if (existentePorCpf) {
      throw new Error('Este CPF já está cadastrado. Faça login para continuar.');
    }

    if (input.email) {
      const existentePorEmail = await this.compradorRepository.buscarPorEmail(input.email);
      if (existentePorEmail) {
        throw new Error('Este e-mail já está cadastrado. Faça login para continuar.');
      }
    }

    const senhaHash = input.senha ? await this.passwordHasher.hash(input.senha) : null;

    const comprador = new Comprador(
      randomUUID(),
      input.grupoId,
      input.nome,
      input.apelido ?? null,
      input.dataNascimento,
      input.telefone,
      cpfDigitos,
      input.endereco,
      input.email ?? null,
      senhaHash,
      0,
      agora,
      agora,
      null,
      null,
      null,
      null,
      null,
    );

    await this.compradorRepository.criar(comprador);

    return { compradorId: comprador.id };
  }
}

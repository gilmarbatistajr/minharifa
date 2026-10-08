import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { PermissaoRecurso } from '../../domain/entities/administrador.entity';
import { validarTelefone } from '../../../compradores/domain/services/validacoes-comprador';

export interface EditarAdministradorMembroInput {
  administradorId: string;
  membroId: string;
  nome?: string;
  email?: string;
  telefone?: string;
  rg?: string;
  permissoes?: PermissaoRecurso[];
}

/**
 * Cobre cadastro-de-administrador-membro.feature: edição de dados cadastrais
 * e das permissões de um membro pelo dono da conta.
 */
@Injectable()
export class EditarAdministradorMembroUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
  ) {}

  async executar(input: EditarAdministradorMembroInput): Promise<void> {
    const solicitante = await this.administradorRepository.buscarPorId(input.administradorId);
    const membro = await this.administradorRepository.buscarPorId(input.membroId);

    if (!solicitante || !membro || !membro.ehMembro() || !membro.pertenceAMesmaConta(solicitante.contaId())) {
      throw new Error('Administrador não encontrado.');
    }

    if (input.telefone !== undefined && !validarTelefone(input.telefone)) {
      throw new Error('Telefone inválido.');
    }

    if (input.email !== undefined && input.email !== membro.email) {
      const emailExistente = await this.administradorRepository.buscarPorEmail(input.email);
      if (emailExistente) {
        throw new Error('Este e-mail já está em uso.');
      }
    }

    membro.atualizarComoMembro({
      nome: input.nome,
      telefone: input.telefone,
      rg: input.rg,
      email: input.email,
      permissoes: input.permissoes,
    });

    await this.administradorRepository.salvar(membro);
  }
}

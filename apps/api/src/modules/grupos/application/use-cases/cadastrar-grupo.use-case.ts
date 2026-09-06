import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GRUPO_REPOSITORY, GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Grupo } from '../../domain/entities/grupo.entity';

export interface CadastrarGrupoInput {
  administradorId: string;
  nome: string;
  identificadorWhatsapp: string;
}

export interface CadastrarGrupoOutput {
  grupoId: string;
}

/**
 * Cobre meus-grupos.feature: "Cadastrar novo grupo" e a rejeição de
 * "cadastrar grupo WhatsApp já vinculado a outro admin".
 */
@Injectable()
export class CadastrarGrupoUseCase {
  constructor(
    @Inject(GRUPO_REPOSITORY)
    private readonly grupoRepository: GrupoRepository,
  ) {}

  async executar(input: CadastrarGrupoInput, agora: Date = new Date()): Promise<CadastrarGrupoOutput> {
    const existente = await this.grupoRepository.buscarPorIdentificadorWhatsapp(
      input.identificadorWhatsapp,
    );

    if (existente) {
      throw new Error('Este grupo do WhatsApp já está vinculado a outro administrador.');
    }

    const grupo = new Grupo(
      randomUUID(),
      input.administradorId,
      input.nome,
      input.identificadorWhatsapp,
      agora,
    );

    await this.grupoRepository.criar(grupo);

    return { grupoId: grupo.id };
  }
}

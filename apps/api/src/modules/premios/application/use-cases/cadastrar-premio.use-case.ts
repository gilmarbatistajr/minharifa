import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PREMIO_REPOSITORY, PremioRepository } from '../../domain/repositories/premio.repository';
import { Premio } from '../../domain/entities/premio.entity';

export interface CadastrarPremioInput {
  administradorId: string;
  nome: string;
  descricao: string;
  fotoUrl: string;
  valor: number;
  valorOpcaoDinheiro?: number;
}

export interface CadastrarPremioOutput {
  premioId: string;
}

/**
 * Cobre cadastro-de-premio.feature: cadastro com dados obrigatórios, valor
 * inválido, e cadastro com/sem opção de troca por dinheiro.
 */
@Injectable()
export class CadastrarPremioUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
  ) {}

  async executar(input: CadastrarPremioInput, agora: Date = new Date()): Promise<CadastrarPremioOutput> {
    if (input.valor <= 0) {
      throw new Error('O valor do prêmio deve ser maior que zero.');
    }

    const premio = new Premio(
      randomUUID(),
      input.administradorId,
      input.nome,
      input.descricao,
      input.fotoUrl,
      input.valor,
      input.valorOpcaoDinheiro ?? null,
      agora,
    );

    await this.premioRepository.criar(premio);

    return { premioId: premio.id };
  }
}

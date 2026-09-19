import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Campanha, FormaVendaCotas } from '../../domain/entities/campanha.entity';
import { PREMIO_REPOSITORY, PremioRepository } from '../../../premios/domain/repositories/premio.repository';

export interface CriarCampanhaInput {
  administradorId: string;
  nome: string;
  descricao: string;
  premioIds: string[];
  quantidadeCotas: number;
  valorCota: number;
  formaVenda: FormaVendaCotas;
}

export interface CriarCampanhaOutput {
  campanhaId: string;
}

/**
 * Cobre a criação de uma campanha independente de grupo: o administrador
 * define o conteúdo (nome, descrição, prêmios, cotas) e revisa antes de
 * lançá-la para um grupo (ver `MarcarCampanhaComoRevisadaUseCase` e
 * `LancarCampanhaUseCase`). As cotas só são materializadas no lançamento.
 */
@Injectable()
export class CriarCampanhaUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: CriarCampanhaInput): Promise<CriarCampanhaOutput> {
    if (input.premioIds.length === 0) {
      throw new Error('Selecione ao menos um prêmio para a campanha.');
    }

    for (const premioId of input.premioIds) {
      const premio = await this.premioRepository.buscarPorId(premioId);
      if (!premio || !premio.pertenceAoAdministrador(input.administradorId)) {
        throw new Error('Um dos prêmios selecionados não foi encontrado.');
      }
    }

    if (input.quantidadeCotas <= 0) {
      throw new Error('A quantidade de cotas deve ser maior que zero.');
    }

    if (input.valorCota <= 0) {
      throw new Error('O valor da cota deve ser maior que zero.');
    }

    const campanha = new Campanha(
      randomUUID(),
      input.administradorId,
      null,
      input.nome,
      input.descricao,
      input.premioIds,
      null,
      null,
      null,
      input.quantidadeCotas,
      input.valorCota,
      input.formaVenda,
      'NOVO',
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );

    await this.campanhaRepository.criar(campanha);

    return { campanhaId: campanha.id };
  }
}

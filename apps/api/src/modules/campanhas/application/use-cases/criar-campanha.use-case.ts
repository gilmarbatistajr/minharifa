import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import {
  Campanha,
  EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS,
  FormaVendaCotas,
} from '../../domain/entities/campanha.entity';
import { PREMIO_REPOSITORY, PremioRepository } from '../../../premios/domain/repositories/premio.repository';

export interface CriarCampanhaInput {
  administradorId: string;
  nome: string;
  descricao: string;
  telefoneSuporte: string;
  premioIds: string[];
  quantidadeCotas: number;
  valorCota: number;
  formaVenda: FormaVendaCotas;
  quantidadeMinimaPorCompra?: number;
  quantidadeMaximaPorCompra?: number | null;
  expiracaoReservaMinutos?: number | null;
  reservaExigeEmail?: boolean;
  reservaExigeNome?: boolean;
  reservaExigeTelefone?: boolean;
  reservaExigeConfirmacaoTelefone?: boolean;
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

    if (!input.telefoneSuporte.trim()) {
      throw new Error('Informe o telefone de suporte da campanha.');
    }

    const quantidadeMinimaPorCompra = input.quantidadeMinimaPorCompra ?? 1;
    if (quantidadeMinimaPorCompra <= 0) {
      throw new Error('A quantidade mínima por compra deve ser maior que zero.');
    }

    const quantidadeMaximaPorCompra = input.quantidadeMaximaPorCompra ?? null;
    if (quantidadeMaximaPorCompra !== null && quantidadeMaximaPorCompra < quantidadeMinimaPorCompra) {
      throw new Error('A quantidade máxima por compra não pode ser menor que a mínima.');
    }

    const expiracaoReservaMinutos =
      input.expiracaoReservaMinutos === undefined ? 5 : input.expiracaoReservaMinutos;
    if (
      expiracaoReservaMinutos !== null &&
      !(EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS as readonly number[]).includes(expiracaoReservaMinutos)
    ) {
      throw new Error('Opção de expiração da reserva inválida.');
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
      null,
      input.telefoneSuporte,
      quantidadeMinimaPorCompra,
      quantidadeMaximaPorCompra,
      expiracaoReservaMinutos,
      input.reservaExigeEmail ?? true,
      input.reservaExigeNome ?? true,
      input.reservaExigeTelefone ?? true,
      input.reservaExigeConfirmacaoTelefone ?? false,
    );

    await this.campanhaRepository.criar(campanha);

    return { campanhaId: campanha.id };
  }
}

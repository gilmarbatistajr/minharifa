import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { EXPIRACOES_RESERVA_PERMITIDAS_MINUTOS, FormaVendaCotas } from '../../domain/entities/campanha.entity';
import { PREMIO_REPOSITORY, PremioRepository } from '../../../premios/domain/repositories/premio.repository';

export interface EditarCampanhaInput {
  administradorId: string;
  campanhaId: string;
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

/**
 * Cobre a edição do conteúdo de uma campanha ainda em status NOVO: mesmas
 * validações da criação (ver `CriarCampanhaUseCase`), aplicadas por cima dos
 * dados já existentes. A regra de que só campanhas novas podem ser editadas
 * vive em `Campanha.atualizar`.
 */
@Injectable()
export class EditarCampanhaUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(input: EditarCampanhaInput): Promise<void> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

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

    campanha.atualizar({
      nome: input.nome,
      descricao: input.descricao,
      telefoneSuporte: input.telefoneSuporte,
      premioIds: input.premioIds,
      quantidadeCotas: input.quantidadeCotas,
      valorCota: input.valorCota,
      formaVenda: input.formaVenda,
      quantidadeMinimaPorCompra,
      quantidadeMaximaPorCompra,
      expiracaoReservaMinutos,
      reservaExigeEmail: input.reservaExigeEmail ?? true,
      reservaExigeNome: input.reservaExigeNome ?? true,
      reservaExigeTelefone: input.reservaExigeTelefone ?? true,
      reservaExigeConfirmacaoTelefone: input.reservaExigeConfirmacaoTelefone ?? false,
    });

    await this.campanhaRepository.salvar(campanha);
  }
}

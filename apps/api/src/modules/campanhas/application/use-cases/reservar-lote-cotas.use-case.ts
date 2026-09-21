import { Inject, Injectable } from '@nestjs/common';
import { COTA_REPOSITORY, CotaRepository } from '../../domain/repositories/cota.repository';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';

export interface ReservarLoteCotasInput {
  campanhaId: string;
  compradorId: string;
  numeros?: number[];
  quantidadeAleatoria?: number;
}

export interface ReservarLoteCotasOutput {
  numeros: number[];
  reservaExpiraEm: Date | null;
}

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Cobre a tela "Escolha sua cota": reserva várias cotas de uma vez, seja
 * por números escolhidos manualmente, seja por uma quantidade aleatória
 * dentro das cotas disponíveis (compra em lote).
 */
@Injectable()
export class ReservarLoteCotasUseCase {
  constructor(
    @Inject(COTA_REPOSITORY)
    private readonly cotaRepository: CotaRepository,
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
  ) {}

  async executar(
    input: ReservarLoteCotasInput,
    agora: Date = new Date(),
  ): Promise<ReservarLoteCotasOutput> {
    const numerosManuais = input.numeros ?? [];

    if (numerosManuais.length === 0 && !input.quantidadeAleatoria) {
      throw new Error('Informe os números desejados ou a quantidade para escolha aleatória.');
    }

    if (numerosManuais.length > 0 && input.quantidadeAleatoria) {
      throw new Error(
        'Escolha apenas uma forma de seleção: números específicos ou quantidade aleatória.',
      );
    }

    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);
    if (!campanha) {
      throw new Error('Campanha não encontrada.');
    }

    if (numerosManuais.length > 0 && !campanha.permiteEscolhaManual()) {
      throw new Error('Esta campanha só permite compra em lotes fechados, não escolha manual de números.');
    }

    if (input.quantidadeAleatoria && !campanha.permiteLoteFechado()) {
      throw new Error('Esta campanha só permite escolha manual de números, não compra em lote.');
    }

    const quantidadeDesejada = numerosManuais.length > 0 ? numerosManuais.length : input.quantidadeAleatoria!;

    if (quantidadeDesejada < campanha.quantidadeMinimaPorCompra) {
      throw new Error(`A compra mínima nesta campanha é de ${campanha.quantidadeMinimaPorCompra} cota(s).`);
    }

    if (campanha.quantidadeMaximaPorCompra !== null && quantidadeDesejada > campanha.quantidadeMaximaPorCompra) {
      throw new Error(`A compra máxima nesta campanha é de ${campanha.quantidadeMaximaPorCompra} cota(s).`);
    }

    const todasAsCotas = await this.cotaRepository.listarPorCampanha(input.campanhaId);

    let cotasParaReservar: Cota[];

    if (numerosManuais.length > 0) {
      cotasParaReservar = numerosManuais.map((numero) => {
        const cota = todasAsCotas.find((candidata) => candidata.numero === numero);
        if (!cota) {
          throw new Error(`Cota ${numero} não existe nessa campanha.`);
        }
        return cota;
      });
    } else {
      const disponiveis = todasAsCotas.filter((cota) => cota.podeSerReservadaPor(agora));
      if (disponiveis.length < input.quantidadeAleatoria!) {
        throw new Error(`Restam apenas ${disponiveis.length} cota(s) disponível(is).`);
      }
      cotasParaReservar = embaralhar(disponiveis).slice(0, input.quantidadeAleatoria!);
    }

    // Valida todas antes de mutar qualquer uma: se uma cota do lote manual
    // não estiver disponível, nenhuma das outras deve ser alterada.
    const indisponivel = cotasParaReservar.find((cota) => !cota.podeSerReservadaPor(agora));
    if (indisponivel) {
      throw new Error(`Cota ${indisponivel.numero} não está disponível para reserva.`);
    }

    for (const cota of cotasParaReservar) {
      cota.reservarPara(input.compradorId, agora, campanha.expiracaoReservaMinutos);
    }

    for (const cota of cotasParaReservar) {
      await this.cotaRepository.salvar(cota);
    }

    return {
      numeros: cotasParaReservar.map((cota) => cota.numero).sort((a, b) => a - b),
      reservaExpiraEm: cotasParaReservar[0].reservaExpiraEm,
    };
  }
}

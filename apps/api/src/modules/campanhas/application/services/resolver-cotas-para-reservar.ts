import { Campanha } from '../../domain/entities/campanha.entity';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Regra de seleção/validação compartilhada pela reserva em lote, tanto para
 * quem tem conta (`ReservarLoteCotasUseCase`) quanto para quem reserva como
 * convidado (`ReservarLoteCotasConvidadoUseCase`): valida forma de venda,
 * quantidade mínima/máxima e disponibilidade, sem mutar nada — quem chama
 * decide como marcar as cotas como reservadas.
 */
export async function resolverCotasParaReservar(
  cotaRepository: CotaRepository,
  campanha: Campanha,
  numeros: number[] | undefined,
  quantidadeAleatoria: number | undefined,
  agora: Date,
): Promise<Cota[]> {
  const numerosManuais = numeros ?? [];

  if (numerosManuais.length === 0 && !quantidadeAleatoria) {
    throw new Error('Informe os números desejados ou a quantidade para escolha aleatória.');
  }

  if (numerosManuais.length > 0 && quantidadeAleatoria) {
    throw new Error(
      'Escolha apenas uma forma de seleção: números específicos ou quantidade aleatória.',
    );
  }

  if (numerosManuais.length > 0 && !campanha.permiteEscolhaManual()) {
    throw new Error('Esta campanha só permite compra em lotes fechados, não escolha manual de números.');
  }

  if (quantidadeAleatoria && !campanha.permiteLoteFechado()) {
    throw new Error('Esta campanha só permite escolha manual de números, não compra em lote.');
  }

  const quantidadeDesejada = numerosManuais.length > 0 ? numerosManuais.length : quantidadeAleatoria!;

  if (quantidadeDesejada < campanha.quantidadeMinimaPorCompra) {
    throw new Error(`A compra mínima nesta campanha é de ${campanha.quantidadeMinimaPorCompra} cota(s).`);
  }

  // Sem um máximo configurado, o teto é o total de cotas da campanha — nunca
  // é permitido comprar mais do que isso, configurado ou não.
  const quantidadeMaximaPermitida = campanha.quantidadeMaximaPorCompra ?? campanha.quantidadeCotas;
  if (quantidadeDesejada > quantidadeMaximaPermitida) {
    throw new Error(`A compra máxima nesta campanha é de ${quantidadeMaximaPermitida} cota(s).`);
  }

  const todasAsCotas = await cotaRepository.listarPorCampanha(campanha.id);

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
    if (disponiveis.length < quantidadeAleatoria!) {
      throw new Error(`Restam apenas ${disponiveis.length} cota(s) disponível(is).`);
    }
    cotasParaReservar = embaralhar(disponiveis).slice(0, quantidadeAleatoria!);
  }

  // Valida todas antes de mutar qualquer uma: se uma cota do lote manual
  // não estiver disponível, nenhuma das outras deve ser alterada.
  const indisponivel = cotasParaReservar.find((cota) => !cota.podeSerReservadaPor(agora));
  if (indisponivel) {
    throw new Error(`Cota ${indisponivel.numero} não está disponível para reserva.`);
  }

  return cotasParaReservar;
}

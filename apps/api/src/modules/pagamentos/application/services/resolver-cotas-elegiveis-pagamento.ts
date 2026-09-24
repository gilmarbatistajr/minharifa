import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';

/**
 * Cobre pagamento-de-cota.feature: "Reserva não pode ser paga parcialmente"
 * — o comprador só pode pagar quando os números informados forem exatamente
 * o conjunto de todas as cotas RESERVADA (ainda dentro do prazo) que ele tem
 * naquela campanha. Não é permitido pagar um subconjunto e deixar o resto
 * pendurado como reservado.
 */
export async function resolverCotasElegiveisParaPagamento(
  cotaRepository: CotaRepository,
  campanhaId: string,
  compradorId: string,
  numerosCotas: number[],
  agora: Date,
): Promise<Cota[]> {
  if (numerosCotas.length === 0) {
    throw new Error('Informe ao menos uma cota para pagamento.');
  }

  const reservadas = await cotaRepository.listarReservadasPorComprador(campanhaId, compradorId);
  const reservadasValidas = reservadas.filter(
    (cota) => !cota.reservaExpiraEm || agora <= cota.reservaExpiraEm,
  );

  if (reservadasValidas.length === 0) {
    throw new Error('Você não tem cotas reservadas para pagar nesta campanha.');
  }

  const numerosReservados = reservadasValidas.map((cota) => cota.numero).sort((a, b) => a - b);
  const numerosSolicitados = [...numerosCotas].sort((a, b) => a - b);
  const mesmoConjunto =
    numerosReservados.length === numerosSolicitados.length &&
    numerosReservados.every((numero, indice) => numero === numerosSolicitados[indice]);

  if (!mesmoConjunto) {
    throw new Error('Você precisa pagar todas as suas cotas reservadas de uma só vez.');
  }

  return reservadasValidas;
}

import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { resolverCotasElegiveisParaPagamento } from './resolver-cotas-elegiveis-pagamento';

describe('resolverCotasElegiveisParaPagamento', () => {
  function criarCota(numero: number, reservaExpiraEm: Date | null = new Date('2026-01-01T10:10:00Z')): Cota {
    return new Cota(
      `cota-${numero}`,
      'campanha-1',
      numero,
      'RESERVADA',
      'comprador-maria',
      new Date('2026-01-01T10:00:00Z'),
      reservaExpiraEm,
    );
  }

  function criarCotaRepository(reservadas: Cota[]): CotaRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      listarReservadasPorComprador: jest.fn().mockResolvedValue(reservadas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
  }

  const agora = new Date('2026-01-01T10:05:00Z');

  it('retorna as cotas quando o conjunto informado é exatamente o das reservas válidas', async () => {
    const reservadas = [criarCota(1), criarCota(2), criarCota(3)];
    const cotaRepository = criarCotaRepository(reservadas);

    const resultado = await resolverCotasElegiveisParaPagamento(
      cotaRepository,
      'campanha-1',
      'comprador-maria',
      [3, 1, 2],
      agora,
    );

    expect(resultado.map((cota) => cota.numero).sort()).toEqual([1, 2, 3]);
  });

  it('rejeita quando faltam números do conjunto reservado (pagamento parcial)', async () => {
    const reservadas = [criarCota(1), criarCota(2), criarCota(3)];
    const cotaRepository = criarCotaRepository(reservadas);

    await expect(
      resolverCotasElegiveisParaPagamento(cotaRepository, 'campanha-1', 'comprador-maria', [1, 2], agora),
    ).rejects.toThrow('Você precisa pagar todas as suas cotas reservadas de uma só vez.');
  });

  it('rejeita quando sobram números além do conjunto reservado', async () => {
    const reservadas = [criarCota(1)];
    const cotaRepository = criarCotaRepository(reservadas);

    await expect(
      resolverCotasElegiveisParaPagamento(cotaRepository, 'campanha-1', 'comprador-maria', [1, 2], agora),
    ).rejects.toThrow('Você precisa pagar todas as suas cotas reservadas de uma só vez.');
  });

  it('ignora reservas já expiradas ao montar o conjunto esperado', async () => {
    const reservadas = [criarCota(1), criarCota(2, new Date('2026-01-01T10:01:00Z'))];
    const cotaRepository = criarCotaRepository(reservadas);

    const resultado = await resolverCotasElegiveisParaPagamento(
      cotaRepository,
      'campanha-1',
      'comprador-maria',
      [1],
      agora,
    );

    expect(resultado.map((cota) => cota.numero)).toEqual([1]);
  });

  it('rejeita quando nenhum número é informado', async () => {
    const cotaRepository = criarCotaRepository([]);

    await expect(
      resolverCotasElegiveisParaPagamento(cotaRepository, 'campanha-1', 'comprador-maria', [], agora),
    ).rejects.toThrow('Informe ao menos uma cota para pagamento.');
  });

  it('rejeita quando o comprador não tem nenhuma cota reservada válida', async () => {
    const reservadas = [criarCota(1, new Date('2026-01-01T10:01:00Z'))];
    const cotaRepository = criarCotaRepository(reservadas);

    await expect(
      resolverCotasElegiveisParaPagamento(cotaRepository, 'campanha-1', 'comprador-maria', [1], agora),
    ).rejects.toThrow('Você não tem cotas reservadas para pagar nesta campanha.');
  });
});

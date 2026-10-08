import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { ListarPagamentosCampanhaUseCase } from './listar-pagamentos-campanha.use-case';

describe('ListarPagamentosCampanhaUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      'grupo-1',
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      10,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarCota(numero: number): Cota {
    return new Cota(`cota-${numero}`, 'campanha-1', numero, 'RESERVADA', 'comprador-1', new Date(), null);
  }

  function criarPagamento(
    cotaId: string,
    valor: number,
    finalizadoPeloCompradorEm: Date | null = null,
  ): Pagamento {
    return new Pagamento(
      `pagamento-${cotaId}`,
      cotaId,
      'comprador-1',
      valor,
      0,
      'PIX',
      'PENDENTE',
      'txn-1',
      new Date(),
      finalizadoPeloCompradorEm,
    );
  }

  function criarDependencias(campanha: Campanha | null, cotas: Cota[], pagamentos: Pagamento[]) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      listarReservadasPorComprador: jest.fn(),
      listarReservadasPorTokenConvidado: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn(),
      listarPorTransacaoGateway: jest.fn(),
      listarPorCotaIds: jest.fn().mockResolvedValue(pagamentos),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    return { campanhaRepository, cotaRepository, pagamentoRepository };
  }

  it('lista valor pago e finalização de cada cota que já tem pagamento, ignorando as sem cobrança', async () => {
    const campanha = criarCampanha();
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const finalizadoEm = new Date('2026-01-01T10:05:00Z');
    const pagamentos = [criarPagamento('cota-1', 50, finalizadoEm), criarPagamento('cota-2', 50, null)];
    const { campanhaRepository, cotaRepository, pagamentoRepository } = criarDependencias(
      campanha,
      cotas,
      pagamentos,
    );
    const useCase = new ListarPagamentosCampanhaUseCase(campanhaRepository, cotaRepository, pagamentoRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' });

    expect(resultado).toEqual([
      { numero: 1, valorPago: 50, finalizadoPeloCompradorEm: finalizadoEm },
      { numero: 2, valorPago: 50, finalizadoPeloCompradorEm: null },
    ]);
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository, cotaRepository, pagamentoRepository } = criarDependencias(null, [], []);
    const useCase = new ListarPagamentosCampanhaUseCase(campanhaRepository, cotaRepository, pagamentoRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const { campanhaRepository, cotaRepository, pagamentoRepository } = criarDependencias(campanha, [], []);
    const useCase = new ListarPagamentosCampanhaUseCase(campanhaRepository, cotaRepository, pagamentoRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });
});

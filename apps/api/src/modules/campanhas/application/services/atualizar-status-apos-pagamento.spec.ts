import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { atualizarStatusCampanhaAposPagamento } from './atualizar-status-apos-pagamento';

describe('atualizarStatusCampanhaAposPagamento', () => {
  function criarCampanha(status: Campanha['status'] = 'LIBERADA'): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      2,
      50,
      'ESCOLHA_NUMERO',
      status,
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarCota(numero: number, status: Cota['status']): Cota {
    return new Cota(`cota-${numero}`, 'campanha-1', numero, status, 'comprador-1', new Date(), null);
  }

  function criarDependencias(cotas: Cota[]) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      listarReservadasPorComprador: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };

    return { campanhaRepository, cotaRepository };
  }

  it('libera a campanha para sorteio quando todas as cotas estão pagas', async () => {
    const campanha = criarCampanha('LIBERADA');
    const { campanhaRepository, cotaRepository } = criarDependencias([
      criarCota(1, 'PAGA'),
      criarCota(2, 'PAGA'),
    ]);

    await atualizarStatusCampanhaAposPagamento(campanhaRepository, cotaRepository, campanha);

    expect(campanha.status).toBe('LIBERADA_PARA_SORTEIO');
    expect(campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('não altera nada quando ainda há cota não paga', async () => {
    const campanha = criarCampanha('LIBERADA');
    const { campanhaRepository, cotaRepository } = criarDependencias([
      criarCota(1, 'PAGA'),
      criarCota(2, 'RESERVADA'),
    ]);

    await atualizarStatusCampanhaAposPagamento(campanhaRepository, cotaRepository, campanha);

    expect(campanha.status).toBe('LIBERADA');
    expect(campanhaRepository.salvar).not.toHaveBeenCalled();
  });

  it('não altera nada quando a campanha não está mais em LIBERADA', async () => {
    const campanha = criarCampanha('LIBERADA_PARA_SORTEIO');
    const { campanhaRepository, cotaRepository } = criarDependencias([criarCota(1, 'PAGA'), criarCota(2, 'PAGA')]);

    await atualizarStatusCampanhaAposPagamento(campanhaRepository, cotaRepository, campanha);

    expect(campanhaRepository.salvar).not.toHaveBeenCalled();
    expect(cotaRepository.listarPorCampanha).not.toHaveBeenCalled();
  });

  it('não altera nada quando a campanha ainda não tem nenhuma cota', async () => {
    const campanha = criarCampanha('LIBERADA');
    const { campanhaRepository, cotaRepository } = criarDependencias([]);

    await atualizarStatusCampanhaAposPagamento(campanhaRepository, cotaRepository, campanha);

    expect(campanha.status).toBe('LIBERADA');
    expect(campanhaRepository.salvar).not.toHaveBeenCalled();
  });
});

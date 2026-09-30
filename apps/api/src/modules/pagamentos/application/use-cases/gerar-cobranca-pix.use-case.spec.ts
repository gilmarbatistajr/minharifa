import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Administrador } from '../../../administradores/domain/entities/administrador.entity';
import { AdministradorRepository } from '../../../administradores/domain/repositories/administrador.repository';
import { Pagamento } from '../../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { GerarCobrancaPixUseCase } from './gerar-cobranca-pix.use-case';

describe('GerarCobrancaPixUseCase', () => {
  function criarCota(numero: number, reservaExpiraEm: Date | null = new Date('2026-01-01T10:02:00Z')): Cota {
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

  function criarCampanha(overrides: Partial<{ chavePix: string | null }> = {}): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de teste',
      'Descrição de teste',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
      null,
      '',
      1,
      null,
      2,
      true,
      true,
      true,
      false,
      null,
      null,
      null,
      false,
      false,
      false,
      'CPF',
      overrides.chavePix === undefined ? '12345678900' : overrides.chavePix,
    );
  }

  function criarAdministrador(nome = 'Maria da Silva'): Administrador {
    return new Administrador(
      'admin-1',
      nome,
      'admin@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(
    cotasReservadas: Cota[],
    campanha: Campanha | null,
    pagamentosExistentesPorCotaId: Record<string, Pagamento | null> = {},
    administrador: Administrador | null = criarAdministrador(),
  ) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn(),
      listarReservadasPorComprador: jest.fn().mockResolvedValue(cotasReservadas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const administradorRepository: AdministradorRepository = {
      buscarPorId: jest.fn().mockResolvedValue(administrador),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      listarMembrosDaConta: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
      remover: jest.fn(),
    };
    const pagamentoRepository: PagamentoRepository = {
      buscarPorId: jest.fn(),
      buscarPorCotaId: jest.fn((cotaId: string) => Promise.resolve(pagamentosExistentesPorCotaId[cotaId] ?? null)),
      listarPorTransacaoGateway: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { cotaRepository, campanhaRepository, administradorRepository, pagamentoRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new GerarCobrancaPixUseCase(
      deps.cotaRepository,
      deps.campanhaRepository,
      deps.administradorRepository,
      deps.pagamentoRepository,
    );
  }

  const agora = new Date('2026-01-01T10:01:00Z');

  it('gera um Pix Copia e Cola pelo valor da cota, direto para a chave Pix da campanha', async () => {
    const cota = criarCota(42);
    const campanha = criarCampanha();
    const deps = criarDependencias([cota], campanha);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(50);
    expect(resultado.validoAte).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(resultado.qrCode).toBe(resultado.codigoCopiaCola);
    expect(resultado.qrCode).toContain('12345678900');
    expect(resultado.qrCode).toContain('MARIA DA SILVA');
    expect(resultado.qrCode).toContain('540550.00');
    expect(deps.pagamentoRepository.criar).toHaveBeenCalledTimes(1);
  });

  it('gera um único Pix cobrindo todas as cotas reservadas de um lote, com o mesmo id de transação', async () => {
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const campanha = criarCampanha();
    const deps = criarDependencias(cotas, campanha);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [1, 2, 3], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(150);
    expect(deps.pagamentoRepository.criar).toHaveBeenCalledTimes(3);
    const idsTransacao = (deps.pagamentoRepository.criar as jest.Mock).mock.calls.map(
      (chamada) => chamada[0].idTransacaoGateway,
    );
    expect(new Set(idsTransacao).size).toBe(1);
    expect(resultado.qrCode).toContain(idsTransacao[0].replace(/-/g, '').toUpperCase().slice(0, 25));
  });

  it('rejeita quando a campanha não tem uma chave Pix cadastrada', async () => {
    const cota = criarCota(42);
    const campanha = criarCampanha({ chavePix: null });
    const deps = criarDependencias([cota], campanha);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Esta campanha ainda não tem uma chave Pix cadastrada.');
    expect(deps.pagamentoRepository.criar).not.toHaveBeenCalled();
  });

  it('rejeita quando o administrador da campanha não é encontrado', async () => {
    const cota = criarCota(42);
    const campanha = criarCampanha();
    const deps = criarDependencias([cota], campanha, {}, null);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Administrador da campanha não encontrado.');
    expect(deps.pagamentoRepository.criar).not.toHaveBeenCalled();
  });

  it('rejeita quando o comprador tenta pagar apenas uma parte das cotas reservadas', async () => {
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const campanha = criarCampanha();
    const deps = criarDependencias(cotas, campanha);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [1, 2], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Você precisa pagar todas as suas cotas reservadas de uma só vez.');
    expect(deps.pagamentoRepository.criar).not.toHaveBeenCalled();
  });

  it('rejeita quando o comprador não tem nenhuma cota reservada para si', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias([], campanha);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Você não tem cotas reservadas para pagar nesta campanha.');
  });

  it('reaproveita um pagamento existente cobrando apenas o valor restante após cashback parcial', async () => {
    const cota = criarCota(42);
    const campanha = criarCampanha();
    const pagamentoExistente = new Pagamento(
      'pagamento-1',
      'cota-42',
      'comprador-maria',
      50,
      20,
      'CASHBACK',
      'PENDENTE',
      null,
      new Date(),
    );
    const deps = criarDependencias([cota], campanha, { 'cota-42': pagamentoExistente });
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numerosCotas: [42], compradorId: 'comprador-maria' },
      agora,
    );

    expect(resultado.valor).toBe(30);
    expect(resultado.qrCode).toContain('540530.00');
    expect(deps.pagamentoRepository.salvar).toHaveBeenCalledWith(pagamentoExistente);
    expect(deps.pagamentoRepository.criar).not.toHaveBeenCalled();
  });
});

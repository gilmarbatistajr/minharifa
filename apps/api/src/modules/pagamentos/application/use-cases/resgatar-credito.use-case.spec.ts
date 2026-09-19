import { CreditoPendente } from '../../domain/entities/credito-pendente.entity';
import { CreditoPendenteRepository } from '../../domain/repositories/credito-pendente.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { ResgatarCreditoUseCase } from './resgatar-credito.use-case';

describe('ResgatarCreditoUseCase', () => {
  function criarCredito(utilizado = false): CreditoPendente {
    return new CreditoPendente('credito-1', 'comprador-maria', 'grupo-1', 'campanha-1', 2, 100, utilizado, new Date());
  }

  function criarCampanhaDestino(grupoId = 'grupo-1'): Campanha {
    return new Campanha(
      'campanha-2',
      'admin-1',
      grupoId,
      'Campanha de teste',
      'Descrição de teste',
      ['premio-2'],
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
    );
  }

  function criarDependencias(credito: CreditoPendente | null, campanha: Campanha | null, cotas: Cota[]) {
    const creditoPendenteRepository: CreditoPendenteRepository = {
      buscarPorId: jest.fn().mockResolvedValue(credito),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const mapaCotasPorNumero = new Map(cotas.map((cota) => [cota.numero, cota]));
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest
        .fn()
        .mockImplementation(async (_campanhaId: string, numero: number) => mapaCotasPorNumero.get(numero) ?? null),
      listarPorCampanha: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { creditoPendenteRepository, campanhaRepository, cotaRepository };
  }

  const agora = new Date('2026-02-01T00:00:00Z');

  it('resgata o crédito pagando as cotas escolhidas diretamente', async () => {
    const credito = criarCredito();
    const campanha = criarCampanhaDestino();
    const cotas = [
      new Cota('cota-10', 'campanha-2', 10, 'DISPONIVEL', null, null, null),
      new Cota('cota-20', 'campanha-2', 20, 'DISPONIVEL', null, null, null),
    ];
    const deps = criarDependencias(credito, campanha, cotas);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.campanhaRepository,
      deps.cotaRepository,
    );

    await useCase.executar(
      { creditoId: 'credito-1', compradorId: 'comprador-maria', campanhaDestinoId: 'campanha-2', numerosCotas: [10, 20] },
      agora,
    );

    expect(cotas[0].status).toBe('PAGA');
    expect(cotas[1].status).toBe('PAGA');
    expect(credito.utilizado).toBe(true);
  });

  it('rejeita quando a quantidade de números não bate com a quantidade do crédito', async () => {
    const credito = criarCredito();
    const deps = criarDependencias(credito, criarCampanhaDestino(), []);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.campanhaRepository,
      deps.cotaRepository,
    );

    await expect(
      useCase.executar(
        { creditoId: 'credito-1', compradorId: 'comprador-maria', campanhaDestinoId: 'campanha-2', numerosCotas: [10] },
        agora,
      ),
    ).rejects.toThrow('quantidade de números escolhidos');
  });

  it('rejeita quando o crédito já foi utilizado', async () => {
    const credito = criarCredito(true);
    const deps = criarDependencias(credito, criarCampanhaDestino(), []);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.campanhaRepository,
      deps.cotaRepository,
    );

    await expect(
      useCase.executar(
        { creditoId: 'credito-1', compradorId: 'comprador-maria', campanhaDestinoId: 'campanha-2', numerosCotas: [10, 20] },
        agora,
      ),
    ).rejects.toThrow('já foi utilizado');
  });

  it('rejeita resgatar em uma campanha de outro grupo', async () => {
    const credito = criarCredito();
    const campanhaOutroGrupo = criarCampanhaDestino('grupo-2');
    const deps = criarDependencias(credito, campanhaOutroGrupo, []);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.campanhaRepository,
      deps.cotaRepository,
    );

    await expect(
      useCase.executar(
        { creditoId: 'credito-1', compradorId: 'comprador-maria', campanhaDestinoId: 'campanha-2', numerosCotas: [10, 20] },
        agora,
      ),
    ).rejects.toThrow('não pode ser resgatado nessa campanha');
  });
});

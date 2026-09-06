import { CreditoPendente } from '../../domain/entities/credito-pendente.entity';
import { CreditoPendenteRepository } from '../../domain/repositories/credito-pendente.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { ResgatarCreditoUseCase } from './resgatar-credito.use-case';

describe('ResgatarCreditoUseCase', () => {
  function criarCredito(utilizado = false): CreditoPendente {
    return new CreditoPendente('credito-1', 'comprador-maria', 'grupo-1', 'sorteio-1', 2, 100, utilizado, new Date());
  }

  function criarSorteioDestino(grupoId = 'grupo-1'): Sorteio {
    return new Sorteio(
      'sorteio-2',
      grupoId,
      'premio-2',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarDependencias(credito: CreditoPendente | null, sorteio: Sorteio | null, cotas: Cota[]) {
    const creditoPendenteRepository: CreditoPendenteRepository = {
      buscarPorId: jest.fn().mockResolvedValue(credito),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(sorteio),
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      salvar: jest.fn(),
    };
    const mapaCotasPorNumero = new Map(cotas.map((cota) => [cota.numero, cota]));
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest
        .fn()
        .mockImplementation(async (_sorteioId: string, numero: number) => mapaCotasPorNumero.get(numero) ?? null),
      listarPorSorteio: jest.fn(),
      contarPagasPorSorteio: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { creditoPendenteRepository, sorteioRepository, cotaRepository };
  }

  const agora = new Date('2026-02-01T00:00:00Z');

  it('resgata o crédito pagando as cotas escolhidas diretamente', async () => {
    const credito = criarCredito();
    const sorteio = criarSorteioDestino();
    const cotas = [
      new Cota('cota-10', 'sorteio-2', 10, 'DISPONIVEL', null, null, null),
      new Cota('cota-20', 'sorteio-2', 20, 'DISPONIVEL', null, null, null),
    ];
    const deps = criarDependencias(credito, sorteio, cotas);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.sorteioRepository,
      deps.cotaRepository,
    );

    await useCase.executar(
      { creditoId: 'credito-1', compradorId: 'comprador-maria', sorteioDestinoId: 'sorteio-2', numerosCotas: [10, 20] },
      agora,
    );

    expect(cotas[0].status).toBe('PAGA');
    expect(cotas[1].status).toBe('PAGA');
    expect(credito.utilizado).toBe(true);
  });

  it('rejeita quando a quantidade de números não bate com a quantidade do crédito', async () => {
    const credito = criarCredito();
    const deps = criarDependencias(credito, criarSorteioDestino(), []);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.sorteioRepository,
      deps.cotaRepository,
    );

    await expect(
      useCase.executar(
        { creditoId: 'credito-1', compradorId: 'comprador-maria', sorteioDestinoId: 'sorteio-2', numerosCotas: [10] },
        agora,
      ),
    ).rejects.toThrow('quantidade de números escolhidos');
  });

  it('rejeita quando o crédito já foi utilizado', async () => {
    const credito = criarCredito(true);
    const deps = criarDependencias(credito, criarSorteioDestino(), []);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.sorteioRepository,
      deps.cotaRepository,
    );

    await expect(
      useCase.executar(
        { creditoId: 'credito-1', compradorId: 'comprador-maria', sorteioDestinoId: 'sorteio-2', numerosCotas: [10, 20] },
        agora,
      ),
    ).rejects.toThrow('já foi utilizado');
  });

  it('rejeita resgatar em um sorteio de outro grupo', async () => {
    const credito = criarCredito();
    const sorteioOutroGrupo = criarSorteioDestino('grupo-2');
    const deps = criarDependencias(credito, sorteioOutroGrupo, []);
    const useCase = new ResgatarCreditoUseCase(
      deps.creditoPendenteRepository,
      deps.sorteioRepository,
      deps.cotaRepository,
    );

    await expect(
      useCase.executar(
        { creditoId: 'credito-1', compradorId: 'comprador-maria', sorteioDestinoId: 'sorteio-2', numerosCotas: [10, 20] },
        agora,
      ),
    ).rejects.toThrow('não pode ser resgatado nesse sorteio');
  });
});

import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { EscolhaPosCancelamento } from '../../domain/entities/escolha-pos-cancelamento.entity';
import { EscolhaPosCancelamentoRepository } from '../../domain/repositories/escolha-pos-cancelamento.repository';
import { CreditoPendenteRepository } from '../../domain/repositories/credito-pendente.repository';
import { EscolherManterCotasUseCase } from './escolher-manter-cotas.use-case';

describe('EscolherManterCotasUseCase', () => {
  function criarEscolha(): EscolhaPosCancelamento {
    return new EscolhaPosCancelamento(
      'escolha-1',
      'sorteio-1',
      'comprador-maria',
      3,
      150,
      'PENDENTE',
      new Date('2026-01-10T00:00:00Z'),
      null,
      new Date('2026-01-01T00:00:00Z'),
    );
  }

  function criarDependencias(escolha: EscolhaPosCancelamento | null, sorteio: Sorteio | null) {
    const escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(escolha),
      listarPendentesExpiradas: jest.fn(),
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
    const creditoPendenteRepository: CreditoPendenteRepository = {
      buscarPorId: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };

    return { escolhaPosCancelamentoRepository, sorteioRepository, creditoPendenteRepository };
  }

  it('registra um crédito pendente com a quantidade e valor da escolha', async () => {
    const escolha = criarEscolha();
    const sorteio = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'CANCELADO',
      null,
      null,
    );
    const deps = criarDependencias(escolha, sorteio);
    const useCase = new EscolherManterCotasUseCase(
      deps.escolhaPosCancelamentoRepository,
      deps.sorteioRepository,
      deps.creditoPendenteRepository,
    );

    const resultado = await useCase.executar(
      { escolhaId: 'escolha-1', compradorId: 'comprador-maria' },
      new Date('2026-01-05T00:00:00Z'),
    );

    expect(resultado.creditoId).toBeDefined();
    expect(escolha.status).toBe('CREDITO_PROXIMO_SORTEIO');
    const creditoCriado = (deps.creditoPendenteRepository.criar as jest.Mock).mock.calls[0][0];
    expect(creditoCriado.grupoId).toBe('grupo-1');
    expect(creditoCriado.quantidadeCotas).toBe(3);
    expect(creditoCriado.valorTotal).toBe(150);
  });

  it('rejeita quando a escolha não pertence ao comprador', async () => {
    const escolha = criarEscolha();
    const deps = criarDependencias(escolha, null);
    const useCase = new EscolherManterCotasUseCase(
      deps.escolhaPosCancelamentoRepository,
      deps.sorteioRepository,
      deps.creditoPendenteRepository,
    );

    await expect(
      useCase.executar({ escolhaId: 'escolha-1', compradorId: 'outro-comprador' }),
    ).rejects.toThrow('Escolha não encontrada.');
  });
});

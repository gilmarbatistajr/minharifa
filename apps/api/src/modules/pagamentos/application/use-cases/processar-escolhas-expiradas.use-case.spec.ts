import { EscolhaPosCancelamento } from '../../domain/entities/escolha-pos-cancelamento.entity';
import { EscolhaPosCancelamentoRepository } from '../../domain/repositories/escolha-pos-cancelamento.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { ProcessarEscolhasExpiradasUseCase } from './processar-escolhas-expiradas.use-case';

describe('ProcessarEscolhasExpiradasUseCase', () => {
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

  function criarComprador(): Comprador {
    return new Comprador(
      'comprador-maria',
      'grupo-1',
      'Maria Silva',
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      'maria@example.com',
      'hash',
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(expiradas: EscolhaPosCancelamento[], comprador: Comprador | null) {
    const escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository = {
      buscarPorId: jest.fn(),
      listarPendentesExpiradas: jest.fn().mockResolvedValue(expiradas),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const compradorRepository: CompradorRepository = {
      buscarPorId: jest.fn().mockResolvedValue(comprador),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };

    return { escolhaPosCancelamentoRepository, compradorRepository };
  }

  it('converte escolhas expiradas em cashback para o comprador', async () => {
    const escolha = criarEscolha();
    const comprador = criarComprador();
    const deps = criarDependencias([escolha], comprador);
    const useCase = new ProcessarEscolhasExpiradasUseCase(
      deps.escolhaPosCancelamentoRepository,
      deps.compradorRepository,
    );

    const resultado = await useCase.executar(new Date('2026-01-11T00:00:00Z'));

    expect(resultado.processadas).toBe(1);
    expect(escolha.status).toBe('CASHBACK');
    expect(comprador.cashbackDisponivel).toBe(150);
  });

  it('não processa nada quando não há escolhas expiradas', async () => {
    const deps = criarDependencias([], null);
    const useCase = new ProcessarEscolhasExpiradasUseCase(
      deps.escolhaPosCancelamentoRepository,
      deps.compradorRepository,
    );

    const resultado = await useCase.executar(new Date('2026-01-11T00:00:00Z'));

    expect(resultado.processadas).toBe(0);
  });
});

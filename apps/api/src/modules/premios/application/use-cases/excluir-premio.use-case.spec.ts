import { Premio } from '../../domain/entities/premio.entity';
import { PremioRepository } from '../../domain/repositories/premio.repository';
import { Campanha, StatusVendasCampanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { ExcluirPremioUseCase } from './excluir-premio.use-case';

describe('ExcluirPremioUseCase', () => {
  function criarPremio(administradorId = 'admin-1'): Premio {
    return new Premio('premio-1', administradorId, 'iPhone 16 Pro', 'Um belo iPhone', null, 8000, null, new Date());
  }

  function criarDependencias(premio: Premio | null, campanhasVinculadas: Campanha[]) {
    const premioRepository: PremioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(premio),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn().mockResolvedValue(undefined),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn().mockResolvedValue(campanhasVinculadas),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };

    return { premioRepository, campanhaRepository };
  }

  function criarCampanha(statusVendas: StatusVendasCampanha): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de Natal',
      'descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      statusVendas,
      null,
      null,
    );
  }

  it('remove um prêmio não vinculado a nenhuma campanha', async () => {
    const premio = criarPremio();
    const { premioRepository, campanhaRepository } = criarDependencias(premio, []);
    const useCase = new ExcluirPremioUseCase(premioRepository, campanhaRepository);

    await useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1' });

    expect(premioRepository.remover).toHaveBeenCalledWith('premio-1');
  });

  it('remove um prêmio vinculado apenas a campanhas já finalizadas/canceladas', async () => {
    const premio = criarPremio();
    const campanha = criarCampanha('FINALIZADO');
    const { premioRepository, campanhaRepository } = criarDependencias(premio, [campanha]);
    const useCase = new ExcluirPremioUseCase(premioRepository, campanhaRepository);

    await useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1' });

    expect(premioRepository.remover).toHaveBeenCalledWith('premio-1');
  });

  it('rejeita remoção de prêmio vinculado a campanha com vendas abertas', async () => {
    const premio = criarPremio();
    const campanha = criarCampanha('VENDAS_ABERTAS');
    const { premioRepository, campanhaRepository } = criarDependencias(premio, [campanha]);
    const useCase = new ExcluirPremioUseCase(premioRepository, campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1' }),
    ).rejects.toThrow('não pode ser removido enquanto estiver vinculado a uma campanha em andamento');
    expect(premioRepository.remover).not.toHaveBeenCalled();
  });

  it('rejeita quando o prêmio não existe', async () => {
    const { premioRepository, campanhaRepository } = criarDependencias(null, []);
    const useCase = new ExcluirPremioUseCase(premioRepository, campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', premioId: 'inexistente' }),
    ).rejects.toThrow('Prêmio não encontrado.');
    expect(premioRepository.remover).not.toHaveBeenCalled();
  });

  it('rejeita quando o prêmio pertence a outro administrador', async () => {
    const premio = criarPremio('admin-2');
    const { premioRepository, campanhaRepository } = criarDependencias(premio, []);
    const useCase = new ExcluirPremioUseCase(premioRepository, campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1' }),
    ).rejects.toThrow('Prêmio não encontrado.');
    expect(premioRepository.remover).not.toHaveBeenCalled();
  });
});

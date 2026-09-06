import { Premio } from '../../domain/entities/premio.entity';
import { PremioRepository } from '../../domain/repositories/premio.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { EditarPremioUseCase } from './editar-premio.use-case';

describe('EditarPremioUseCase', () => {
  function criarPremio(administradorId = 'admin-1'): Premio {
    return new Premio(
      'premio-1',
      administradorId,
      'iPhone 16 Pro',
      'Um belo iPhone',
      'https://exemplo.com/foto.png',
      8000,
      null,
      new Date(),
    );
  }

  function criarDependencias(premio: Premio | null, sorteioVinculado: Sorteio | null) {
    const premioRepository: PremioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(premio),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn(),
      buscarPorPremioId: jest.fn().mockResolvedValue(sorteioVinculado),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      salvar: jest.fn(),
    };

    return { premioRepository, sorteioRepository };
  }

  function criarSorteio(status: Sorteio['status']): Sorteio {
    return new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      status,
      null,
      null,
    );
  }

  it('permite editar um prêmio não vinculado a nenhum sorteio', async () => {
    const premio = criarPremio();
    const { premioRepository, sorteioRepository } = criarDependencias(premio, null);
    const useCase = new EditarPremioUseCase(premioRepository, sorteioRepository);

    await useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1', valor: 7500 });

    expect(premio.valor).toBe(7500);
    expect(premioRepository.salvar).toHaveBeenCalledWith(premio);
  });

  it('rejeita edição de prêmio vinculado a sorteio com vendas abertas', async () => {
    const premio = criarPremio();
    const sorteio = criarSorteio('VENDAS_ABERTAS');
    const { premioRepository, sorteioRepository } = criarDependencias(premio, sorteio);
    const useCase = new EditarPremioUseCase(premioRepository, sorteioRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1', valor: 7500 }),
    ).rejects.toThrow('não pode ser editado enquanto o sorteio estiver em andamento');
    expect(premioRepository.salvar).not.toHaveBeenCalled();
  });

  it('permite editar prêmio vinculado a sorteio já finalizado', async () => {
    const premio = criarPremio();
    const sorteio = criarSorteio('FINALIZADO');
    const { premioRepository, sorteioRepository } = criarDependencias(premio, sorteio);
    const useCase = new EditarPremioUseCase(premioRepository, sorteioRepository);

    await useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1', valor: 7500 });

    expect(premio.valor).toBe(7500);
  });

  it('rejeita quando o prêmio não existe', async () => {
    const { premioRepository, sorteioRepository } = criarDependencias(null, null);
    const useCase = new EditarPremioUseCase(premioRepository, sorteioRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', premioId: 'inexistente', valor: 7500 }),
    ).rejects.toThrow('Prêmio não encontrado.');
  });

  it('rejeita quando o prêmio pertence a outro administrador', async () => {
    const premio = criarPremio('admin-2');
    const { premioRepository, sorteioRepository } = criarDependencias(premio, null);
    const useCase = new EditarPremioUseCase(premioRepository, sorteioRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', premioId: 'premio-1', valor: 7500 }),
    ).rejects.toThrow('Prêmio não encontrado.');
  });
});

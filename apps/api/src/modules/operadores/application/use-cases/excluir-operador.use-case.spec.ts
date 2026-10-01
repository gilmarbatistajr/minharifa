import { Operador } from '../../domain/entities/operador.entity';
import { OperadorRepository } from '../../domain/repositories/operador.repository';
import { ExcluirOperadorUseCase } from './excluir-operador.use-case';

describe('ExcluirOperadorUseCase', () => {
  function criarRepositorioFake(operador: Operador | null): OperadorRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(operador),
      buscarPorLogin: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
  }

  it('remove o operador quando pertence ao administrador', async () => {
    const operador = new Operador(
      'operador-1',
      'admin-1',
      'Maria Souza',
      'Rua das Flores, 123',
      '52998224725',
      'MG-12.345.678',
      '31999998888',
      'maria.souza',
      'hash-secreto',
      ['grupo-1'],
      new Date(),
    );
    const operadorRepository = criarRepositorioFake(operador);
    const useCase = new ExcluirOperadorUseCase(operadorRepository);

    await useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1' });

    expect(operadorRepository.remover).toHaveBeenCalledWith('operador-1');
  });

  it('lança erro se o operador não existir', async () => {
    const operadorRepository = criarRepositorioFake(null);
    const useCase = new ExcluirOperadorUseCase(operadorRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'inexistente' }),
    ).rejects.toThrow('Operador não encontrado.');
    expect(operadorRepository.remover).not.toHaveBeenCalled();
  });

  it('lança erro se o operador pertencer a outro administrador', async () => {
    const operador = new Operador(
      'operador-1',
      'outro-admin',
      'Maria Souza',
      'Rua das Flores, 123',
      '52998224725',
      'MG-12.345.678',
      '31999998888',
      'maria.souza',
      'hash-secreto',
      ['grupo-1'],
      new Date(),
    );
    const operadorRepository = criarRepositorioFake(operador);
    const useCase = new ExcluirOperadorUseCase(operadorRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1' }),
    ).rejects.toThrow('Operador não encontrado.');
    expect(operadorRepository.remover).not.toHaveBeenCalled();
  });
});

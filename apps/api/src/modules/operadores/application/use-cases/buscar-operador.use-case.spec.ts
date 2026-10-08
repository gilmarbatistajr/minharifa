import { Operador } from '../../domain/entities/operador.entity';
import { OperadorRepository } from '../../domain/repositories/operador.repository';
import { BuscarOperadorUseCase } from './buscar-operador.use-case';

describe('BuscarOperadorUseCase', () => {
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

  it('retorna o resumo do operador quando pertence ao administrador', async () => {
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
    const useCase = new BuscarOperadorUseCase(criarRepositorioFake(operador));

    const resultado = await useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1' });

    expect(resultado.id).toBe('operador-1');
    expect(resultado).not.toHaveProperty('senhaHash');
  });

  it('lança erro se o operador não existir', async () => {
    const useCase = new BuscarOperadorUseCase(criarRepositorioFake(null));

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'inexistente' }),
    ).rejects.toThrow('Operador não encontrado.');
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
    const useCase = new BuscarOperadorUseCase(criarRepositorioFake(operador));

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1' }),
    ).rejects.toThrow('Operador não encontrado.');
  });
});

import { Operador } from '../../domain/entities/operador.entity';
import { OperadorRepository } from '../../domain/repositories/operador.repository';
import { ListarOperadoresDoAdministradorUseCase } from './listar-operadores-administrador.use-case';

describe('ListarOperadoresDoAdministradorUseCase', () => {
  it('lista os operadores do administrador sem expor a senha', async () => {
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
      new Date('2026-01-01T00:00:00Z'),
      [{ recurso: 'CAMPANHAS', podeCriar: true, podeEditar: false, podeRemover: false }],
    );
    const operadorRepository: OperadorRepository = {
      buscarPorId: jest.fn(),
      buscarPorLogin: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue([operador]),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
    const useCase = new ListarOperadoresDoAdministradorUseCase(operadorRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).not.toHaveProperty('senhaHash');
    expect(resultado[0]).toEqual({
      id: 'operador-1',
      nomeCompleto: 'Maria Souza',
      endereco: 'Rua das Flores, 123',
      cpf: '52998224725',
      rg: 'MG-12.345.678',
      telefone: '31999998888',
      login: 'maria.souza',
      grupoIds: ['grupo-1'],
      permissoes: [{ recurso: 'CAMPANHAS', podeCriar: true, podeEditar: false, podeRemover: false }],
      criadoEm: operador.criadoEm,
    });
  });

  it('retorna lista vazia quando o administrador não tem operadores', async () => {
    const operadorRepository: OperadorRepository = {
      buscarPorId: jest.fn(),
      buscarPorLogin: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue([]),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
    const useCase = new ListarOperadoresDoAdministradorUseCase(operadorRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([]);
  });
});

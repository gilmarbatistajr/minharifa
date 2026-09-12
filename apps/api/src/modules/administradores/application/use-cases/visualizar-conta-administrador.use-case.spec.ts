import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { VisualizarContaAdministradorUseCase } from './visualizar-conta-administrador.use-case';

describe('VisualizarContaAdministradorUseCase', () => {
  function criarRepositorio(administrador: Administrador | null): AdministradorRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(administrador),
      buscarPorEmail: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };
  }

  it('retorna os dados da conta do administrador autenticado', async () => {
    const administrador = new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash',
      true,
      new Date('2026-01-01T00:00:00Z'),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
    const useCase = new VisualizarContaAdministradorUseCase(criarRepositorio(administrador));

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual({
      nome: 'João',
      email: 'joao@example.com',
      emailConfirmado: true,
      criadoEm: new Date('2026-01-01T00:00:00Z'),
    });
  });

  it('rejeita quando o administrador não existe', async () => {
    const useCase = new VisualizarContaAdministradorUseCase(criarRepositorio(null));

    await expect(useCase.executar({ administradorId: 'inexistente' })).rejects.toThrow(
      'Administrador não encontrado.',
    );
  });
});

import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { AtualizarNomeAdministradorUseCase } from './atualizar-nome-administrador.use-case';

/**
 * Cobre conta-administrador.feature: "Atualizar nome".
 */
describe('AtualizarNomeAdministradorUseCase', () => {
  function criarRepositorio(administrador: Administrador | null): AdministradorRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(administrador),
      buscarPorEmail: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
  }

  it('atualiza o nome do administrador autenticado', async () => {
    const administrador = new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
    const repositorio = criarRepositorio(administrador);
    const useCase = new AtualizarNomeAdministradorUseCase(repositorio);

    await useCase.executar({ administradorId: 'admin-1', nome: 'João da Silva' });

    expect(administrador.nome).toBe('João da Silva');
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
  });

  it('rejeita quando o administrador não existe', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new AtualizarNomeAdministradorUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'inexistente', nome: 'Novo Nome' }),
    ).rejects.toThrow('Administrador não encontrado.');
  });
});

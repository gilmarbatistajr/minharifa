import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { ConfirmarNovoEmailAdministradorUseCase } from './confirmar-novo-email-administrador.use-case';

describe('ConfirmarNovoEmailAdministradorUseCase', () => {
  function criarRepositorio(administrador: Administrador | null): AdministradorRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn().mockResolvedValue(administrador),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
  }

  it('efetiva a troca de e-mail com token válido', async () => {
    const administrador = new Administrador(
      'admin-1',
      'João',
      'antigo@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      'novo@example.com',
      'token-email',
      new Date('2026-01-03T00:00:00Z'),
    );
    const repositorio = criarRepositorio(administrador);
    const useCase = new ConfirmarNovoEmailAdministradorUseCase(repositorio);

    await useCase.executar({ token: 'token-email' }, new Date('2026-01-02T00:00:00Z'));

    expect(administrador.email).toBe('novo@example.com');
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
  });

  it('rejeita token inexistente', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new ConfirmarNovoEmailAdministradorUseCase(repositorio);

    await expect(useCase.executar({ token: 'inexistente' })).rejects.toThrow(
      'Token de confirmação de e-mail inválido.',
    );
  });
});

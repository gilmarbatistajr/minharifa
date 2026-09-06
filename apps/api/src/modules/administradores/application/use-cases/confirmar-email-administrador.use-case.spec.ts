import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { ConfirmarEmailAdministradorUseCase } from './confirmar-email-administrador.use-case';

/**
 * Cobre login-administrador.feature: "Confirmação de e-mail antes de
 * liberar a criação de sorteios".
 */
describe('ConfirmarEmailAdministradorUseCase', () => {
  function criarRepositorio(administrador: Administrador | null): AdministradorRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn().mockResolvedValue(administrador),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
  }

  it('confirma o e-mail quando o token é válido', async () => {
    const administrador = new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash',
      false,
      new Date('2026-01-01T00:00:00Z'),
      'token-123',
      new Date('2026-01-03T00:00:00Z'),
      null,
      null,
      null,
      null,
      null,
    );
    const repositorio = criarRepositorio(administrador);
    const useCase = new ConfirmarEmailAdministradorUseCase(repositorio);

    await useCase.executar({ token: 'token-123' }, new Date('2026-01-02T00:00:00Z'));

    expect(administrador.emailConfirmado).toBe(true);
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
  });

  it('rejeita quando o token não pertence a nenhum administrador', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new ConfirmarEmailAdministradorUseCase(repositorio);

    await expect(useCase.executar({ token: 'inexistente' })).rejects.toThrow(
      'Token de confirmação de e-mail inválido.',
    );
  });
});

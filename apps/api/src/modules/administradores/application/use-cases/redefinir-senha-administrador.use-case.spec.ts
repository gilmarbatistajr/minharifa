import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { RedefinirSenhaAdministradorUseCase } from './redefinir-senha-administrador.use-case';

/**
 * Cobre login-administrador.feature: "Recuperação de senha" (redefinição)
 * e o cenário de link de redefinição expirado (login-cliente.feature aplica
 * a mesma regra de negócio para administradores).
 */
describe('RedefinirSenhaAdministradorUseCase', () => {
  function criarRepositorio(administrador: Administrador | null): AdministradorRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn().mockResolvedValue(administrador),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
  }

  it('redefine a senha com um link válido', async () => {
    const administrador = new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash-antigo',
      true,
      new Date(),
      null,
      null,
      'token-abc',
      new Date('2026-01-01T11:00:00Z'),
      null,
      null,
      null,
    );
    const repositorio = criarRepositorio(administrador);
    const passwordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hash-novo'),
      comparar: jest.fn(),
    };
    const useCase = new RedefinirSenhaAdministradorUseCase(repositorio, passwordHasher);

    await useCase.executar(
      { token: 'token-abc', novaSenha: 'senha-nova' },
      new Date('2026-01-01T10:30:00Z'),
    );

    expect(administrador.senhaHash).toBe('hash-novo');
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
  });

  it('rejeita quando o token não corresponde a nenhum administrador', async () => {
    const repositorio = criarRepositorio(null);
    const passwordHasher: PasswordHasher = { hash: jest.fn(), comparar: jest.fn() };
    const useCase = new RedefinirSenhaAdministradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({ token: 'inexistente', novaSenha: 'senha-nova' }),
    ).rejects.toThrow('Link de redefinição de senha inválido.');
  });

  it('rejeita quando o link já expirou', async () => {
    const administrador = new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash-antigo',
      true,
      new Date(),
      null,
      null,
      'token-abc',
      new Date('2026-01-01T09:00:00Z'),
      null,
      null,
      null,
    );
    const repositorio = criarRepositorio(administrador);
    const passwordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hash-novo'),
      comparar: jest.fn(),
    };
    const useCase = new RedefinirSenhaAdministradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar(
        { token: 'token-abc', novaSenha: 'senha-nova' },
        new Date('2026-01-01T10:00:00Z'),
      ),
    ).rejects.toThrow('expirado');
  });
});

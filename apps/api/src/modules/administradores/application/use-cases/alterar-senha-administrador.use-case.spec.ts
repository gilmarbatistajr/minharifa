import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { AlterarSenhaAdministradorUseCase } from './alterar-senha-administrador.use-case';

/**
 * Cobre conta-administrador.feature: "Alterar senha" e a tentativa com
 * senha atual incorreta.
 */
describe('AlterarSenhaAdministradorUseCase', () => {
  function criarAdministrador(): Administrador {
    return new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash-antigo',
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
  }

  function criarDependencias(administrador: Administrador | null) {
    const repositorio: AdministradorRepository = {
      buscarPorId: jest.fn().mockResolvedValue(administrador),
      buscarPorEmail: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
    const passwordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hash-novo'),
      comparar: jest.fn(),
    };

    return { repositorio, passwordHasher };
  }

  it('altera a senha quando a senha atual está correta', async () => {
    const administrador = criarAdministrador();
    const { repositorio, passwordHasher } = criarDependencias(administrador);
    (passwordHasher.comparar as jest.Mock).mockResolvedValue(true);
    const useCase = new AlterarSenhaAdministradorUseCase(repositorio, passwordHasher);

    await useCase.executar({
      administradorId: 'admin-1',
      senhaAtual: 'senha-certa',
      novaSenha: 'senha-nova',
    });

    expect(administrador.senhaHash).toBe('hash-novo');
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
  });

  it('rejeita quando a senha atual está incorreta', async () => {
    const administrador = criarAdministrador();
    const { repositorio, passwordHasher } = criarDependencias(administrador);
    (passwordHasher.comparar as jest.Mock).mockResolvedValue(false);
    const useCase = new AlterarSenhaAdministradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({
        administradorId: 'admin-1',
        senhaAtual: 'senha-errada',
        novaSenha: 'senha-nova',
      }),
    ).rejects.toThrow('Senha atual incorreta.');
    expect(repositorio.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando o administrador não existe', async () => {
    const { repositorio, passwordHasher } = criarDependencias(null);
    const useCase = new AlterarSenhaAdministradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({
        administradorId: 'inexistente',
        senhaAtual: 'qualquer',
        novaSenha: 'senha-nova',
      }),
    ).rejects.toThrow('Administrador não encontrado.');
  });
});

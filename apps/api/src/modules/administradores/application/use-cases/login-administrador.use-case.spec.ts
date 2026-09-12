import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenService } from '../../../../shared/auth/token.service';
import { LoginAdministradorUseCase } from './login-administrador.use-case';

/**
 * Cobre login-administrador.feature: "Login com e-mail e senha válidos"
 * e a rejeição por credenciais inválidas.
 */
describe('LoginAdministradorUseCase', () => {
  function criarAdministrador(): Administrador {
    return new Administrador(
      'admin-1',
      'João',
      'joao@example.com',
      'hash-correto',
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
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn().mockResolvedValue(administrador),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };
    const passwordHasher: PasswordHasher = {
      hash: jest.fn(),
      comparar: jest.fn(),
    };
    const tokenService = {
      gerarTokenAdministrador: jest.fn().mockReturnValue('jwt-gerado'),
    } as unknown as TokenService;

    return { repositorio, passwordHasher, tokenService };
  }

  it('autentica com e-mail e senha válidos', async () => {
    const administrador = criarAdministrador();
    const { repositorio, passwordHasher, tokenService } = criarDependencias(administrador);
    (passwordHasher.comparar as jest.Mock).mockResolvedValue(true);
    const useCase = new LoginAdministradorUseCase(repositorio, passwordHasher, tokenService);

    const resultado = await useCase.executar({ email: 'joao@example.com', senha: 'senha-certa' });

    expect(resultado.token).toBe('jwt-gerado');
    expect(resultado.administradorId).toBe('admin-1');
    expect(tokenService.gerarTokenAdministrador).toHaveBeenCalledWith('admin-1');
  });

  it('rejeita quando o e-mail não existe', async () => {
    const { repositorio, passwordHasher, tokenService } = criarDependencias(null);
    const useCase = new LoginAdministradorUseCase(repositorio, passwordHasher, tokenService);

    await expect(
      useCase.executar({ email: 'inexistente@example.com', senha: 'qualquer' }),
    ).rejects.toThrow('E-mail ou senha inválidos.');
  });

  it('rejeita quando a senha está incorreta', async () => {
    const administrador = criarAdministrador();
    const { repositorio, passwordHasher, tokenService } = criarDependencias(administrador);
    (passwordHasher.comparar as jest.Mock).mockResolvedValue(false);
    const useCase = new LoginAdministradorUseCase(repositorio, passwordHasher, tokenService);

    await expect(
      useCase.executar({ email: 'joao@example.com', senha: 'senha-errada' }),
    ).rejects.toThrow('E-mail ou senha inválidos.');
  });
});

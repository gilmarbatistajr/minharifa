import { Operador } from '../../domain/entities/operador.entity';
import { OperadorRepository } from '../../domain/repositories/operador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenService } from '../../../../shared/auth/token.service';
import { LoginOperadorUseCase } from './login-operador.use-case';

describe('LoginOperadorUseCase', () => {
  function criarOperador(): Operador {
    return new Operador(
      'operador-1',
      'admin-1',
      'Maria Souza',
      'Rua das Flores, 123',
      '52998224725',
      'MG-12.345.678',
      '31999998888',
      'maria.souza',
      'hash-armazenado',
      ['grupo-1'],
      new Date(),
    );
  }

  function criarRepositorioFake(operador: Operador | null): OperadorRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorLogin: jest.fn().mockResolvedValue(operador),
      buscarPorCpf: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
  }

  it('autentica com login e senha corretos', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioFake(operador);
    const passwordHasher: PasswordHasher = { hash: jest.fn(), comparar: jest.fn().mockResolvedValue(true) };
    const tokenService = { gerarTokenOperador: jest.fn().mockReturnValue('token-jwt') } as unknown as TokenService;
    const useCase = new LoginOperadorUseCase(operadorRepository, passwordHasher, tokenService);

    const resultado = await useCase.executar({ login: 'maria.souza', senha: 'senhaCorreta' });

    expect(resultado).toEqual({ token: 'token-jwt', operadorId: 'operador-1', nomeCompleto: 'Maria Souza' });
    expect(passwordHasher.comparar).toHaveBeenCalledWith('senhaCorreta', 'hash-armazenado');
  });

  it('rejeita login inexistente', async () => {
    const operadorRepository = criarRepositorioFake(null);
    const passwordHasher: PasswordHasher = { hash: jest.fn(), comparar: jest.fn() };
    const tokenService = { gerarTokenOperador: jest.fn() } as unknown as TokenService;
    const useCase = new LoginOperadorUseCase(operadorRepository, passwordHasher, tokenService);

    await expect(useCase.executar({ login: 'inexistente', senha: 'qualquer' })).rejects.toThrow(
      'Login ou senha inválidos.',
    );
  });

  it('rejeita senha incorreta', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioFake(operador);
    const passwordHasher: PasswordHasher = { hash: jest.fn(), comparar: jest.fn().mockResolvedValue(false) };
    const tokenService = { gerarTokenOperador: jest.fn() } as unknown as TokenService;
    const useCase = new LoginOperadorUseCase(operadorRepository, passwordHasher, tokenService);

    await expect(useCase.executar({ login: 'maria.souza', senha: 'errada' })).rejects.toThrow(
      'Login ou senha inválidos.',
    );
  });
});

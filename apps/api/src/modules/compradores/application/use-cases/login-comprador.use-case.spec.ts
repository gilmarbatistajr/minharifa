import { Comprador } from '../../domain/entities/comprador.entity';
import { CompradorRepository } from '../../domain/repositories/comprador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenService } from '../../../../shared/auth/token.service';
import { LoginCompradorUseCase } from './login-comprador.use-case';

describe('LoginCompradorUseCase', () => {
  function criarComprador(senhaHash: string | null = 'hash-correto'): Comprador {
    return new Comprador(
      'comprador-1',
      'grupo-1',
      'Maria Silva',
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      'maria@example.com',
      senhaHash,
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(comprador: Comprador | null) {
    const repositorio: CompradorRepository = {
      buscarPorId: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn().mockResolvedValue(comprador),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };
    const passwordHasher: PasswordHasher = { hash: jest.fn(), comparar: jest.fn() };
    const tokenService = {
      gerarTokenComprador: jest.fn().mockReturnValue('jwt-gerado'),
    } as unknown as TokenService;

    return { repositorio, passwordHasher, tokenService };
  }

  it('autentica com e-mail e senha válidos', async () => {
    const comprador = criarComprador();
    const { repositorio, passwordHasher, tokenService } = criarDependencias(comprador);
    (passwordHasher.comparar as jest.Mock).mockResolvedValue(true);
    const useCase = new LoginCompradorUseCase(repositorio, passwordHasher, tokenService);

    const resultado = await useCase.executar({ email: 'maria@example.com', senha: 'senha-certa' });

    expect(resultado.token).toBe('jwt-gerado');
    expect(tokenService.gerarTokenComprador).toHaveBeenCalledWith('comprador-1', 'grupo-1');
  });

  it('rejeita quando o e-mail não existe', async () => {
    const { repositorio, passwordHasher, tokenService } = criarDependencias(null);
    const useCase = new LoginCompradorUseCase(repositorio, passwordHasher, tokenService);

    await expect(
      useCase.executar({ email: 'inexistente@example.com', senha: 'qualquer' }),
    ).rejects.toThrow('E-mail ou senha inválidos.');
  });

  it('rejeita quando o comprador não definiu senha (cadastro via login social)', async () => {
    const comprador = criarComprador(null);
    const { repositorio, passwordHasher, tokenService } = criarDependencias(comprador);
    const useCase = new LoginCompradorUseCase(repositorio, passwordHasher, tokenService);

    await expect(
      useCase.executar({ email: 'maria@example.com', senha: 'qualquer' }),
    ).rejects.toThrow('E-mail ou senha inválidos.');
  });

  it('rejeita quando a senha está incorreta', async () => {
    const comprador = criarComprador();
    const { repositorio, passwordHasher, tokenService } = criarDependencias(comprador);
    (passwordHasher.comparar as jest.Mock).mockResolvedValue(false);
    const useCase = new LoginCompradorUseCase(repositorio, passwordHasher, tokenService);

    await expect(
      useCase.executar({ email: 'maria@example.com', senha: 'senha-errada' }),
    ).rejects.toThrow('E-mail ou senha inválidos.');
  });
});

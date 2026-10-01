import { Comprador } from '../../domain/entities/comprador.entity';
import { CompradorRepository } from '../../domain/repositories/comprador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { RedefinirSenhaCompradorUseCase } from './redefinir-senha-comprador.use-case';

describe('RedefinirSenhaCompradorUseCase', () => {
  function criarComprador(): Comprador {
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
      'hash-antigo',
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      'token-abc',
      new Date('2026-01-01T11:00:00Z'),
    );
  }

  function criarDependencias(comprador: Comprador | null) {
    const repositorio: CompradorRepository = {
      buscarPorId: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn().mockResolvedValue(comprador),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
    const passwordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hash-novo'),
      comparar: jest.fn(),
    };

    return { repositorio, passwordHasher };
  }

  it('redefine a senha com link válido', async () => {
    const comprador = criarComprador();
    const { repositorio, passwordHasher } = criarDependencias(comprador);
    const useCase = new RedefinirSenhaCompradorUseCase(repositorio, passwordHasher);

    await useCase.executar(
      { token: 'token-abc', novaSenha: 'senha-nova' },
      new Date('2026-01-01T10:30:00Z'),
    );

    expect(comprador.senhaHash).toBe('hash-novo');
    expect(repositorio.salvar).toHaveBeenCalledWith(comprador);
  });

  it('rejeita quando o token não corresponde a nenhum comprador', async () => {
    const { repositorio, passwordHasher } = criarDependencias(null);
    const useCase = new RedefinirSenhaCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar({ token: 'inexistente', novaSenha: 'senha-nova' }),
    ).rejects.toThrow('Link de redefinição de senha inválido.');
  });

  it('rejeita quando o link já expirou', async () => {
    const comprador = criarComprador();
    const { repositorio, passwordHasher } = criarDependencias(comprador);
    const useCase = new RedefinirSenhaCompradorUseCase(repositorio, passwordHasher);

    await expect(
      useCase.executar(
        { token: 'token-abc', novaSenha: 'senha-nova' },
        new Date('2026-01-01T12:00:00Z'),
      ),
    ).rejects.toThrow('expirado');
  });
});

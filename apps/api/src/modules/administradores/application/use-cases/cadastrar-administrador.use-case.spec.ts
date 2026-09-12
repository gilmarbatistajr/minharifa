import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TokenGenerator } from '../../../../shared/domain/token-generator';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { CadastrarAdministradorUseCase } from './cadastrar-administrador.use-case';

/**
 * Cobre login-administrador.feature: "Cadastro de um novo administrador".
 */
describe('CadastrarAdministradorUseCase', () => {
  function criarDependencias(existente: Administrador | null = null) {
    const repositorio: AdministradorRepository = {
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn().mockResolvedValue(existente),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
    };
    const passwordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hash-da-senha'),
      comparar: jest.fn(),
    };
    const tokenGenerator: TokenGenerator = {
      gerar: jest.fn().mockReturnValue('token-confirmacao'),
    };
    const notificationSender: NotificationSender = {
      enviarEmail: jest.fn().mockResolvedValue(undefined),
    };

    return { repositorio, passwordHasher, tokenGenerator, notificationSender };
  }

  it('cadastra um novo administrador com e-mail não confirmado e envia token', async () => {
    const { repositorio, passwordHasher, tokenGenerator, notificationSender } =
      criarDependencias();
    const useCase = new CadastrarAdministradorUseCase(
      repositorio,
      passwordHasher,
      tokenGenerator,
      notificationSender,
    );
    const agora = new Date('2026-01-01T00:00:00Z');

    const resultado = await useCase.executar(
      { nome: 'João', email: 'joao@example.com', senha: 'senha-forte' },
      agora,
    );

    expect(resultado.administradorId).toBeDefined();
    expect(passwordHasher.hash).toHaveBeenCalledWith('senha-forte');
    expect(repositorio.criar).toHaveBeenCalled();
    const administradorCriado = (repositorio.criar as jest.Mock).mock.calls[0][0] as Administrador;
    expect(administradorCriado.emailConfirmado).toBe(false);
    expect(administradorCriado.tokenConfirmacaoEmail).toBe('token-confirmacao');
    expect(notificationSender.enviarEmail).toHaveBeenCalledWith(
      'joao@example.com',
      expect.any(String),
      expect.stringContaining('token-confirmacao'),
    );
  });

  it('rejeita cadastro com e-mail já utilizado', async () => {
    const existente = new Administrador(
      'admin-1',
      'Outro',
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
    const { repositorio, passwordHasher, tokenGenerator, notificationSender } =
      criarDependencias(existente);
    const useCase = new CadastrarAdministradorUseCase(
      repositorio,
      passwordHasher,
      tokenGenerator,
      notificationSender,
    );

    await expect(
      useCase.executar({ nome: 'João', email: 'joao@example.com', senha: 'senha-forte' }),
    ).rejects.toThrow('Já existe um administrador');
    expect(repositorio.criar).not.toHaveBeenCalled();
  });
});

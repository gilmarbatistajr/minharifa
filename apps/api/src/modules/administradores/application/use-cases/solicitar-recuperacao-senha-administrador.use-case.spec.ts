import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { TokenGenerator } from '../../../../shared/domain/token-generator';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { SolicitarRecuperacaoSenhaAdministradorUseCase } from './solicitar-recuperacao-senha-administrador.use-case';

/**
 * Cobre login-administrador.feature: "Recuperação de senha".
 */
describe('SolicitarRecuperacaoSenhaAdministradorUseCase', () => {
  function criarDependencias(administrador: Administrador | null) {
    const repositorio: AdministradorRepository = {
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn().mockResolvedValue(administrador),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
    const tokenGenerator: TokenGenerator = { gerar: jest.fn().mockReturnValue('token-recuperacao') };
    const notificationSender: NotificationSender = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

    return { repositorio, tokenGenerator, notificationSender };
  }

  it('gera token de recuperação e envia e-mail quando o administrador existe', async () => {
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
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(administrador);
    const useCase = new SolicitarRecuperacaoSenhaAdministradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await useCase.executar({ email: 'joao@example.com' }, new Date('2026-01-01T00:00:00Z'));

    expect(administrador.tokenRecuperacaoSenha).toBe('token-recuperacao');
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
    expect(notificationSender.enviarEmail).toHaveBeenCalled();
  });

  it('não revela se o e-mail não está cadastrado', async () => {
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(null);
    const useCase = new SolicitarRecuperacaoSenhaAdministradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await expect(
      useCase.executar({ email: 'inexistente@example.com' }),
    ).resolves.toBeUndefined();
    expect(repositorio.salvar).not.toHaveBeenCalled();
    expect(notificationSender.enviarEmail).not.toHaveBeenCalled();
  });
});

import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { TokenGenerator } from '../../../../shared/domain/token-generator';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { SolicitarTrocaEmailAdministradorUseCase } from './solicitar-troca-email-administrador.use-case';

/**
 * Cobre conta-administrador.feature: "Tentativa de alterar e-mail (exige
 * confirmação por link)".
 */
describe('SolicitarTrocaEmailAdministradorUseCase', () => {
  function criarAdministrador(): Administrador {
    return new Administrador(
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
  }

  function criarDependencias(
    administrador: Administrador | null,
    emailEmUso: Administrador | null = null,
  ) {
    const repositorio: AdministradorRepository = {
      buscarPorId: jest.fn().mockResolvedValue(administrador),
      buscarPorEmail: jest.fn().mockResolvedValue(emailEmUso),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
    const tokenGenerator: TokenGenerator = { gerar: jest.fn().mockReturnValue('token-novo-email') };
    const notificationSender: NotificationSender = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

    return { repositorio, tokenGenerator, notificationSender };
  }

  it('registra a solicitação de troca e envia confirmação para o novo e-mail', async () => {
    const administrador = criarAdministrador();
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(administrador);
    const useCase = new SolicitarTrocaEmailAdministradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await useCase.executar(
      { administradorId: 'admin-1', novoEmail: 'novo@example.com' },
      new Date('2026-01-01T00:00:00Z'),
    );

    expect(administrador.email).toBe('joao@example.com');
    expect(administrador.novoEmailPendente).toBe('novo@example.com');
    expect(repositorio.salvar).toHaveBeenCalledWith(administrador);
    expect(notificationSender.enviarEmail).toHaveBeenCalledWith(
      'novo@example.com',
      expect.any(String),
      expect.any(String),
    );
  });

  it('rejeita quando o novo e-mail já pertence a outro administrador', async () => {
    const administrador = criarAdministrador();
    const outroAdministrador = new Administrador(
      'admin-2',
      'Maria',
      'novo@example.com',
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
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(
      administrador,
      outroAdministrador,
    );
    const useCase = new SolicitarTrocaEmailAdministradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await expect(
      useCase.executar({ administradorId: 'admin-1', novoEmail: 'novo@example.com' }),
    ).rejects.toThrow('já está em uso');
  });

  it('rejeita quando o administrador não existe', async () => {
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(null);
    const useCase = new SolicitarTrocaEmailAdministradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await expect(
      useCase.executar({ administradorId: 'inexistente', novoEmail: 'novo@example.com' }),
    ).rejects.toThrow('Administrador não encontrado.');
  });
});

import { Comprador } from '../../domain/entities/comprador.entity';
import { CompradorRepository } from '../../domain/repositories/comprador.repository';
import { TokenGenerator } from '../../../../shared/domain/token-generator';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { SolicitarRecuperacaoSenhaCompradorUseCase } from './solicitar-recuperacao-senha-comprador.use-case';

describe('SolicitarRecuperacaoSenhaCompradorUseCase', () => {
  function criarDependencias(comprador: Comprador | null) {
    const repositorio: CompradorRepository = {
      buscarPorId: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn().mockResolvedValue(comprador),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      criar: jest.fn(),
    };
    const tokenGenerator: TokenGenerator = { gerar: jest.fn().mockReturnValue('token-recuperacao') };
    const notificationSender: NotificationSender = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

    return { repositorio, tokenGenerator, notificationSender };
  }

  it('envia e-mail de recuperação quando o comprador existe', async () => {
    const comprador = new Comprador(
      'comprador-1',
      'grupo-1',
      'Maria Silva',
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      'maria@example.com',
      'hash',
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(comprador);
    const useCase = new SolicitarRecuperacaoSenhaCompradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await useCase.executar({ email: 'maria@example.com' });

    expect(comprador.tokenRecuperacaoSenha).toBe('token-recuperacao');
    expect(notificationSender.enviarEmail).toHaveBeenCalledWith(
      'maria@example.com',
      expect.any(String),
      expect.any(String),
    );
  });

  it('não revela se o e-mail não está cadastrado', async () => {
    const { repositorio, tokenGenerator, notificationSender } = criarDependencias(null);
    const useCase = new SolicitarRecuperacaoSenhaCompradorUseCase(
      repositorio,
      tokenGenerator,
      notificationSender,
    );

    await expect(useCase.executar({ email: 'inexistente@example.com' })).resolves.toBeUndefined();
    expect(repositorio.salvar).not.toHaveBeenCalled();
  });
});

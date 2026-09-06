import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { TOKEN_GENERATOR, TokenGenerator } from '../../../../shared/domain/token-generator';
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from '../../../../shared/domain/notification-sender';

export interface SolicitarRecuperacaoSenhaAdministradorInput {
  email: string;
}

const MINUTOS_VALIDADE_TOKEN = 60;

@Injectable()
export class SolicitarRecuperacaoSenhaAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(
    input: SolicitarRecuperacaoSenhaAdministradorInput,
    agora: Date = new Date(),
  ): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorEmail(input.email);

    // Não revela se o e-mail existe ou não, para evitar enumeração de contas.
    if (!administrador) {
      return;
    }

    const token = this.tokenGenerator.gerar();
    administrador.solicitarRecuperacaoSenha(token, agora, MINUTOS_VALIDADE_TOKEN);

    await this.administradorRepository.salvar(administrador);

    await this.notificationSender.enviarEmail(
      administrador.email,
      'Recuperação de senha',
      `Use o token ${token} para redefinir sua senha.`,
    );
  }
}

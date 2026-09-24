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

export interface SolicitarTrocaEmailAdministradorInput {
  administradorId: string;
  novoEmail: string;
}

const HORAS_VALIDADE_TOKEN = 48;

/**
 * Cobre conta-administrador.feature: "Tentativa de alterar e-mail" — a troca
 * só é efetivada após confirmação por link (ver ConfirmarNovoEmailAdministradorUseCase).
 */
@Injectable()
export class SolicitarTrocaEmailAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(
    input: SolicitarTrocaEmailAdministradorInput,
    agora: Date = new Date(),
  ): Promise<void> {
    const administrador = await this.administradorRepository.buscarPorId(input.administradorId);

    if (!administrador) {
      throw new Error('Administrador não encontrado.');
    }

    const emailEmUso = await this.administradorRepository.buscarPorEmail(input.novoEmail);
    if (emailEmUso && emailEmUso.id !== administrador.id) {
      throw new Error('Este e-mail já está em uso por outro administrador.');
    }

    const token = this.tokenGenerator.gerar();
    administrador.solicitarTrocaEmail(input.novoEmail, token, agora, HORAS_VALIDADE_TOKEN);

    await this.administradorRepository.salvar(administrador);

    await this.notificationSender.enviarEmail(
      input.novoEmail,
      'Confirme seu novo e-mail',
      `Use o token ${token} para confirmar seu novo e-mail.`,
    );
  }
}

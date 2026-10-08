import { Inject, Injectable } from '@nestjs/common';
import {
  COMPRADOR_REPOSITORY,
  CompradorRepository,
} from '../../domain/repositories/comprador.repository';
import { TOKEN_GENERATOR, TokenGenerator } from '../../../../shared/domain/token-generator';
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from '../../../../shared/domain/notification-sender';

export interface SolicitarRecuperacaoSenhaCompradorInput {
  email: string;
}

const MINUTOS_VALIDADE_TOKEN = 60;

/** Cobre login-cliente.feature: "Solicitação de recuperação de senha". */
@Injectable()
export class SolicitarRecuperacaoSenhaCompradorUseCase {
  constructor(
    @Inject(COMPRADOR_REPOSITORY)
    private readonly compradorRepository: CompradorRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(
    input: SolicitarRecuperacaoSenhaCompradorInput,
    agora: Date = new Date(),
  ): Promise<void> {
    const comprador = await this.compradorRepository.buscarPorEmail(input.email);

    if (!comprador) {
      return;
    }

    const token = this.tokenGenerator.gerar();
    comprador.solicitarRecuperacaoSenha(token, agora, MINUTOS_VALIDADE_TOKEN);

    await this.compradorRepository.salvar(comprador);

    await this.notificationSender.enviarEmail(
      comprador.email as string,
      'Recuperação de senha',
      `Use o token ${token} para redefinir sua senha.`,
    );
  }
}

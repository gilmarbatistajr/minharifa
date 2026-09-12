import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorRepository,
} from '../../domain/repositories/administrador.repository';
import { Administrador } from '../../domain/entities/administrador.entity';
import { PASSWORD_HASHER, PasswordHasher } from '../../../../shared/domain/password-hasher';
import { TOKEN_GENERATOR, TokenGenerator } from '../../../../shared/domain/token-generator';
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from '../../../../shared/domain/notification-sender';

export interface CadastrarAdministradorInput {
  nome: string;
  email: string;
  senha: string;
}

export interface CadastrarAdministradorOutput {
  administradorId: string;
}

const HORAS_VALIDADE_CONFIRMACAO_EMAIL = 48;

@Injectable()
export class CadastrarAdministradorUseCase {
  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY)
    private readonly administradorRepository: AdministradorRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  async executar(
    input: CadastrarAdministradorInput,
    agora: Date = new Date(),
  ): Promise<CadastrarAdministradorOutput> {
    const existente = await this.administradorRepository.buscarPorEmail(input.email);
    if (existente) {
      throw new Error('Já existe um administrador cadastrado com este e-mail.');
    }

    const senhaHash = await this.passwordHasher.hash(input.senha);
    const tokenConfirmacao = this.tokenGenerator.gerar();

    const administrador = new Administrador(
      randomUUID(),
      input.nome,
      input.email,
      senhaHash,
      false,
      agora,
      tokenConfirmacao,
      new Date(agora.getTime() + HORAS_VALIDADE_CONFIRMACAO_EMAIL * 3_600_000),
      null,
      null,
      null,
      null,
      null,
    );

    await this.administradorRepository.criar(administrador);

    await this.notificationSender.enviarEmail(
      administrador.email,
      'Confirme seu e-mail',
      `Use o token ${tokenConfirmacao} para confirmar seu e-mail.`,
    );

    return { administradorId: administrador.id };
  }
}

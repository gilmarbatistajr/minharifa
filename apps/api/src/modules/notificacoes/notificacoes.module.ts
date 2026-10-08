import { Module } from '@nestjs/common';
import { NOTIFICACAO_REPOSITORY } from './domain/repositories/notificacao.repository';
import { PrismaNotificacaoRepository } from './infrastructure/prisma-notificacao.repository';
import { RegistrarNovaVendaUseCase } from './application/use-cases/registrar-nova-venda.use-case';
import { RegistrarMarcosDeVendaUseCase } from './application/use-cases/registrar-marcos-de-venda.use-case';
import { ListarNotificacoesUseCase } from './application/use-cases/listar-notificacoes.use-case';
import { MarcarNotificacaoComoLidaUseCase } from './application/use-cases/marcar-notificacao-como-lida.use-case';
import { MarcarTodasNotificacoesComoLidasUseCase } from './application/use-cases/marcar-todas-notificacoes-como-lidas.use-case';
import { NotificacoesController } from './presentation/notificacoes.controller';

@Module({
  controllers: [NotificacoesController],
  providers: [
    { provide: NOTIFICACAO_REPOSITORY, useClass: PrismaNotificacaoRepository },
    RegistrarNovaVendaUseCase,
    RegistrarMarcosDeVendaUseCase,
    ListarNotificacoesUseCase,
    MarcarNotificacaoComoLidaUseCase,
    MarcarTodasNotificacoesComoLidasUseCase,
  ],
  exports: [RegistrarNovaVendaUseCase, RegistrarMarcosDeVendaUseCase],
})
export class NotificacoesModule {}

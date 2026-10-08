import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdministradorOuOperadorGuard } from '../../../shared/auth/guards/administrador-ou-operador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { ListarNotificacoesUseCase } from '../application/use-cases/listar-notificacoes.use-case';
import { MarcarNotificacaoComoLidaUseCase } from '../application/use-cases/marcar-notificacao-como-lida.use-case';
import { MarcarTodasNotificacoesComoLidasUseCase } from '../application/use-cases/marcar-todas-notificacoes-como-lidas.use-case';

/** Menu "Notificações" — acessível tanto ao administrador quanto ao operador. */
@UseGuards(AdministradorOuOperadorGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(
    private readonly listarNotificacoesUseCase: ListarNotificacoesUseCase,
    private readonly marcarNotificacaoComoLidaUseCase: MarcarNotificacaoComoLidaUseCase,
    private readonly marcarTodasNotificacoesComoLidasUseCase: MarcarTodasNotificacoesComoLidasUseCase,
  ) {}

  @Get()
  async listar(@CurrentUser() usuario: PrincipalAutenticado, @Query('limite') limite?: string) {
    const parsed = limite ? Number(limite) : undefined;
    return this.listarNotificacoesUseCase.executar({
      administradorId: usuario.administradorId,
      operadorId: usuario.operadorId,
      limite: parsed && parsed > 0 ? Math.min(parsed, 200) : undefined,
    });
  }

  // Declarada antes de ":notificacaoId/lida" para o literal não ser tratado como id.
  @Post('marcar-todas-lidas')
  @HttpCode(204)
  async marcarTodasComoLidas(@CurrentUser() usuario: PrincipalAutenticado) {
    await this.marcarTodasNotificacoesComoLidasUseCase.executar({
      administradorId: usuario.administradorId,
      operadorId: usuario.operadorId,
    });
  }

  @Post(':notificacaoId/lida')
  @HttpCode(204)
  async marcarComoLida(@CurrentUser() usuario: PrincipalAutenticado, @Param('notificacaoId') notificacaoId: string) {
    await this.marcarNotificacaoComoLidaUseCase.executar({
      administradorId: usuario.administradorId,
      operadorId: usuario.operadorId,
      notificacaoId,
    });
  }
}

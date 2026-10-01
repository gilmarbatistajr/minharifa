import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CompradorGuard } from '../../../shared/auth/guards/comprador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { GerarCobrancaPixUseCase } from '../application/use-cases/gerar-cobranca-pix.use-case';
import { GerarCobrancaPixConvidadoUseCase } from '../application/use-cases/gerar-cobranca-pix-convidado.use-case';
import { PagarComCartaoUseCase } from '../application/use-cases/pagar-com-cartao.use-case';
import { PagarComCashbackUseCase } from '../application/use-cases/pagar-com-cashback.use-case';
import { ConfirmarPagamentoWebhookUseCase } from '../application/use-cases/confirmar-pagamento-webhook.use-case';
import { IniciarCancelamentoCampanhaUseCase } from '../application/use-cases/iniciar-cancelamento-campanha.use-case';
import { EscolherReembolsoUseCase } from '../application/use-cases/escolher-reembolso.use-case';
import { EscolherManterCotasUseCase } from '../application/use-cases/escolher-manter-cotas.use-case';
import { ResgatarCreditoUseCase } from '../application/use-cases/resgatar-credito.use-case';
import { FinalizarCompraUseCase } from '../application/use-cases/finalizar-compra.use-case';
import { FinalizarCompraConvidadoUseCase } from '../application/use-cases/finalizar-compra-convidado.use-case';
import { ListarPagamentosCampanhaUseCase } from '../application/use-cases/listar-pagamentos-campanha.use-case';
import { GerarCobrancaPixDto } from './dto/gerar-cobranca-pix.dto';
import { GerarCobrancaPixConvidadoDto } from './dto/gerar-cobranca-pix-convidado.dto';
import { PagarComCartaoDto } from './dto/pagar-com-cartao.dto';
import { PagarComCashbackDto } from './dto/pagar-com-cashback.dto';
import { ConfirmarPagamentoWebhookDto } from './dto/confirmar-pagamento-webhook.dto';
import { ResgatarCreditoDto } from './dto/resgatar-credito.dto';
import { FinalizarCompraDto } from './dto/finalizar-compra.dto';
import { FinalizarCompraConvidadoDto } from './dto/finalizar-compra-convidado.dto';

@Controller()
export class PagamentosController {
  constructor(
    private readonly gerarCobrancaPixUseCase: GerarCobrancaPixUseCase,
    private readonly gerarCobrancaPixConvidadoUseCase: GerarCobrancaPixConvidadoUseCase,
    private readonly pagarComCartaoUseCase: PagarComCartaoUseCase,
    private readonly pagarComCashbackUseCase: PagarComCashbackUseCase,
    private readonly confirmarPagamentoWebhookUseCase: ConfirmarPagamentoWebhookUseCase,
    private readonly iniciarCancelamentoCampanhaUseCase: IniciarCancelamentoCampanhaUseCase,
    private readonly escolherReembolsoUseCase: EscolherReembolsoUseCase,
    private readonly escolherManterCotasUseCase: EscolherManterCotasUseCase,
    private readonly resgatarCreditoUseCase: ResgatarCreditoUseCase,
    private readonly finalizarCompraUseCase: FinalizarCompraUseCase,
    private readonly finalizarCompraConvidadoUseCase: FinalizarCompraConvidadoUseCase,
    private readonly listarPagamentosCampanhaUseCase: ListarPagamentosCampanhaUseCase,
  ) {}

  @UseGuards(CompradorGuard)
  @Post('pagamentos/pix')
  async gerarCobrancaPix(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: GerarCobrancaPixDto) {
    return this.gerarCobrancaPixUseCase.executar({
      campanhaId: dto.campanhaId,
      numerosCotas: dto.numerosCotas,
      compradorId: usuario.compradorId!,
    });
  }

  // Sem guard de propósito: gera o Pix da reserva feita sem login (ver
  // ReservarLoteCotasConvidadoUseCase) — localizada pelo tokenReservaConvidado
  // em vez de uma sessão de comprador.
  @Post('pagamentos/pix/convidado')
  async gerarCobrancaPixConvidado(@Body() dto: GerarCobrancaPixConvidadoDto) {
    return this.gerarCobrancaPixConvidadoUseCase.executar({
      campanhaId: dto.campanhaId,
      numerosCotas: dto.numerosCotas,
      tokenReservaConvidado: dto.tokenReservaConvidado,
    });
  }

  @UseGuards(CompradorGuard)
  @Post('pagamentos/cartao')
  async pagarComCartao(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: PagarComCartaoDto) {
    return this.pagarComCartaoUseCase.executar({
      campanhaId: dto.campanhaId,
      numerosCotas: dto.numerosCotas,
      compradorId: usuario.compradorId!,
      dadosCartao: dto.dadosCartao,
    });
  }

  @UseGuards(CompradorGuard)
  @Post('pagamentos/cashback')
  async pagarComCashback(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: PagarComCashbackDto) {
    return this.pagarComCashbackUseCase.executar({
      campanhaId: dto.campanhaId,
      numerosCotas: dto.numerosCotas,
      compradorId: usuario.compradorId!,
    });
  }

  @Post('pagamentos/webhook')
  async confirmarPagamentoWebhook(@Body() dto: ConfirmarPagamentoWebhookDto) {
    return this.confirmarPagamentoWebhookUseCase.executar(dto);
  }

  // Puramente informativo pro administrador (ver "Cotas compradas") — não
  // confirma pagamento nem muda status de nada.
  @UseGuards(CompradorGuard)
  @Post('pagamentos/finalizar')
  async finalizarCompra(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: FinalizarCompraDto) {
    return this.finalizarCompraUseCase.executar({
      campanhaId: dto.campanhaId,
      numerosCotas: dto.numerosCotas,
      compradorId: usuario.compradorId!,
    });
  }

  // Sem guard de propósito: mesma finalização, para quem comprou sem login
  // (ver ReservarLoteCotasConvidadoUseCase) — localizada pelo tokenReservaConvidado.
  @Post('pagamentos/finalizar/convidado')
  async finalizarCompraConvidado(@Body() dto: FinalizarCompraConvidadoDto) {
    return this.finalizarCompraConvidadoUseCase.executar({
      campanhaId: dto.campanhaId,
      numerosCotas: dto.numerosCotas,
      tokenReservaConvidado: dto.tokenReservaConvidado,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get('pagamentos/campanha/:campanhaId')
  async listarPagamentosCampanha(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.listarPagamentosCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post('campanhas/:campanhaId/cancelamento')
  async iniciarCancelamento(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.iniciarCancelamentoCampanhaUseCase.executar({
      campanhaId,
      administradorId: usuario.administradorId!,
    });
  }

  @UseGuards(CompradorGuard)
  @Post('cancelamentos/escolhas/:escolhaId/reembolso')
  async escolherReembolso(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('escolhaId') escolhaId: string,
  ) {
    return this.escolherReembolsoUseCase.executar({ escolhaId, compradorId: usuario.compradorId! });
  }

  @UseGuards(CompradorGuard)
  @Post('cancelamentos/escolhas/:escolhaId/manter-cotas')
  async escolherManterCotas(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('escolhaId') escolhaId: string,
  ) {
    return this.escolherManterCotasUseCase.executar({ escolhaId, compradorId: usuario.compradorId! });
  }

  @UseGuards(CompradorGuard)
  @Post('cancelamentos/creditos/:creditoId/resgatar')
  async resgatarCredito(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('creditoId') creditoId: string,
    @Body() dto: ResgatarCreditoDto,
  ) {
    return this.resgatarCreditoUseCase.executar({
      creditoId,
      compradorId: usuario.compradorId!,
      campanhaDestinoId: dto.campanhaDestinoId,
      numerosCotas: dto.numerosCotas,
    });
  }
}

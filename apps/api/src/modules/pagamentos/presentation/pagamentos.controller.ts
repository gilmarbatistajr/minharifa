import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CompradorGuard } from '../../../shared/auth/guards/comprador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { GerarCobrancaPixUseCase } from '../application/use-cases/gerar-cobranca-pix.use-case';
import { PagarComCartaoUseCase } from '../application/use-cases/pagar-com-cartao.use-case';
import { PagarComCashbackUseCase } from '../application/use-cases/pagar-com-cashback.use-case';
import { ConfirmarPagamentoWebhookUseCase } from '../application/use-cases/confirmar-pagamento-webhook.use-case';
import { IniciarCancelamentoSorteioUseCase } from '../application/use-cases/iniciar-cancelamento-sorteio.use-case';
import { EscolherReembolsoUseCase } from '../application/use-cases/escolher-reembolso.use-case';
import { EscolherManterCotasUseCase } from '../application/use-cases/escolher-manter-cotas.use-case';
import { ResgatarCreditoUseCase } from '../application/use-cases/resgatar-credito.use-case';
import { GerarCobrancaPixDto } from './dto/gerar-cobranca-pix.dto';
import { PagarComCartaoDto } from './dto/pagar-com-cartao.dto';
import { ConfirmarPagamentoWebhookDto } from './dto/confirmar-pagamento-webhook.dto';
import { ResgatarCreditoDto } from './dto/resgatar-credito.dto';

@Controller()
export class PagamentosController {
  constructor(
    private readonly gerarCobrancaPixUseCase: GerarCobrancaPixUseCase,
    private readonly pagarComCartaoUseCase: PagarComCartaoUseCase,
    private readonly pagarComCashbackUseCase: PagarComCashbackUseCase,
    private readonly confirmarPagamentoWebhookUseCase: ConfirmarPagamentoWebhookUseCase,
    private readonly iniciarCancelamentoSorteioUseCase: IniciarCancelamentoSorteioUseCase,
    private readonly escolherReembolsoUseCase: EscolherReembolsoUseCase,
    private readonly escolherManterCotasUseCase: EscolherManterCotasUseCase,
    private readonly resgatarCreditoUseCase: ResgatarCreditoUseCase,
  ) {}

  @UseGuards(CompradorGuard)
  @Post('pagamentos/pix')
  async gerarCobrancaPix(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: GerarCobrancaPixDto) {
    return this.gerarCobrancaPixUseCase.executar({
      sorteioId: dto.sorteioId,
      numeroCota: dto.numeroCota,
      compradorId: usuario.compradorId!,
    });
  }

  @UseGuards(CompradorGuard)
  @Post('pagamentos/cartao')
  async pagarComCartao(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: PagarComCartaoDto) {
    return this.pagarComCartaoUseCase.executar({
      sorteioId: dto.sorteioId,
      numeroCota: dto.numeroCota,
      compradorId: usuario.compradorId!,
      dadosCartao: dto.dadosCartao,
    });
  }

  @UseGuards(CompradorGuard)
  @Post('pagamentos/cashback')
  async pagarComCashback(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: GerarCobrancaPixDto) {
    return this.pagarComCashbackUseCase.executar({
      sorteioId: dto.sorteioId,
      numeroCota: dto.numeroCota,
      compradorId: usuario.compradorId!,
    });
  }

  @Post('pagamentos/webhook')
  async confirmarPagamentoWebhook(@Body() dto: ConfirmarPagamentoWebhookDto) {
    return this.confirmarPagamentoWebhookUseCase.executar(dto);
  }

  @UseGuards(AdministradorGuard)
  @Post('sorteios/:sorteioId/cancelamento')
  async iniciarCancelamento(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('sorteioId') sorteioId: string,
  ) {
    return this.iniciarCancelamentoSorteioUseCase.executar({
      sorteioId,
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
      sorteioDestinoId: dto.sorteioDestinoId,
      numerosCotas: dto.numerosCotas,
    });
  }
}

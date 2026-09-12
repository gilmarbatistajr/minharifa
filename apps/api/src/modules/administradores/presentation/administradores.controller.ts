import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarAdministradorUseCase } from '../application/use-cases/cadastrar-administrador.use-case';
import { ConfirmarEmailAdministradorUseCase } from '../application/use-cases/confirmar-email-administrador.use-case';
import { LoginAdministradorUseCase } from '../application/use-cases/login-administrador.use-case';
import { SolicitarRecuperacaoSenhaAdministradorUseCase } from '../application/use-cases/solicitar-recuperacao-senha-administrador.use-case';
import { RedefinirSenhaAdministradorUseCase } from '../application/use-cases/redefinir-senha-administrador.use-case';
import { VisualizarContaAdministradorUseCase } from '../application/use-cases/visualizar-conta-administrador.use-case';
import { AtualizarNomeAdministradorUseCase } from '../application/use-cases/atualizar-nome-administrador.use-case';
import { AlterarSenhaAdministradorUseCase } from '../application/use-cases/alterar-senha-administrador.use-case';
import { SolicitarTrocaEmailAdministradorUseCase } from '../application/use-cases/solicitar-troca-email-administrador.use-case';
import { ConfirmarNovoEmailAdministradorUseCase } from '../application/use-cases/confirmar-novo-email-administrador.use-case';
import { ObterVisaoGeralDashboardUseCase } from '../application/use-cases/obter-visao-geral-dashboard.use-case';
import { CadastrarAdministradorDto } from './dto/cadastrar-administrador.dto';
import { LoginAdministradorDto } from './dto/login-administrador.dto';
import { TokenDto } from './dto/token.dto';
import { SolicitarRecuperacaoSenhaDto } from './dto/solicitar-recuperacao-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { AtualizarNomeDto } from './dto/atualizar-nome.dto';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { SolicitarTrocaEmailDto } from './dto/solicitar-troca-email.dto';

@Controller('administradores')
export class AdministradoresController {
  constructor(
    private readonly cadastrarAdministradorUseCase: CadastrarAdministradorUseCase,
    private readonly confirmarEmailUseCase: ConfirmarEmailAdministradorUseCase,
    private readonly loginUseCase: LoginAdministradorUseCase,
    private readonly solicitarRecuperacaoSenhaUseCase: SolicitarRecuperacaoSenhaAdministradorUseCase,
    private readonly redefinirSenhaUseCase: RedefinirSenhaAdministradorUseCase,
    private readonly visualizarContaUseCase: VisualizarContaAdministradorUseCase,
    private readonly atualizarNomeUseCase: AtualizarNomeAdministradorUseCase,
    private readonly alterarSenhaUseCase: AlterarSenhaAdministradorUseCase,
    private readonly solicitarTrocaEmailUseCase: SolicitarTrocaEmailAdministradorUseCase,
    private readonly confirmarNovoEmailUseCase: ConfirmarNovoEmailAdministradorUseCase,
    private readonly obterVisaoGeralDashboardUseCase: ObterVisaoGeralDashboardUseCase,
  ) {}

  @Post()
  async cadastrar(@Body() dto: CadastrarAdministradorDto) {
    return this.cadastrarAdministradorUseCase.executar(dto);
  }

  @Post('confirmar-email')
  async confirmarEmail(@Body() dto: TokenDto) {
    return this.confirmarEmailUseCase.executar(dto);
  }

  @Post('confirmar-novo-email')
  async confirmarNovoEmail(@Body() dto: TokenDto) {
    return this.confirmarNovoEmailUseCase.executar(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginAdministradorDto) {
    return this.loginUseCase.executar(dto);
  }

  @Post('recuperar-senha')
  async solicitarRecuperacaoSenha(@Body() dto: SolicitarRecuperacaoSenhaDto) {
    return this.solicitarRecuperacaoSenhaUseCase.executar(dto);
  }

  @Post('redefinir-senha')
  async redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.redefinirSenhaUseCase.executar(dto);
  }

  @UseGuards(AdministradorGuard)
  @Get('me')
  async visualizarConta(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.visualizarContaUseCase.executar({ administradorId: usuario.administradorId! });
  }

  @UseGuards(AdministradorGuard)
  @Patch('me/nome')
  async atualizarNome(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: AtualizarNomeDto) {
    return this.atualizarNomeUseCase.executar({
      administradorId: usuario.administradorId!,
      nome: dto.nome,
    });
  }

  @UseGuards(AdministradorGuard)
  @Patch('me/senha')
  async alterarSenha(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: AlterarSenhaDto) {
    return this.alterarSenhaUseCase.executar({
      administradorId: usuario.administradorId!,
      senhaAtual: dto.senhaAtual,
      novaSenha: dto.novaSenha,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post('me/email')
  async solicitarTrocaEmail(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Body() dto: SolicitarTrocaEmailDto,
  ) {
    return this.solicitarTrocaEmailUseCase.executar({
      administradorId: usuario.administradorId!,
      novoEmail: dto.novoEmail,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get('dashboard')
  async obterVisaoGeralDashboard(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.obterVisaoGeralDashboardUseCase.executar({
      administradorId: usuario.administradorId!,
    });
  }
}

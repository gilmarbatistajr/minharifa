import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CompradorGuard } from '../../../shared/auth/guards/comprador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarGrupoUseCase } from '../application/use-cases/cadastrar-grupo.use-case';
import { ListarGruposDoAdministradorUseCase } from '../application/use-cases/listar-grupos-administrador.use-case';
import { BuscarGrupoUseCase } from '../application/use-cases/buscar-grupo.use-case';
import { CriarAgenteChatbotUseCase } from '../application/use-cases/criar-agente-chatbot.use-case';
import { ConfigurarAvisosAgenteChatbotUseCase } from '../application/use-cases/configurar-avisos-agente-chatbot.use-case';
import { DesativarAgenteChatbotUseCase } from '../application/use-cases/desativar-agente-chatbot.use-case';
import { ListarCompradoresDoGrupoUseCase } from '../application/use-cases/listar-compradores-grupo.use-case';
import { ContarSorteiosDoGrupoUseCase } from '../application/use-cases/contar-sorteios-grupo.use-case';
import { GerarLinkConviteUseCase } from '../application/use-cases/gerar-link-convite.use-case';
import { ValidarCodigoConviteUseCase } from '../application/use-cases/validar-codigo-convite.use-case';
import { RevogarLinkConviteUseCase } from '../application/use-cases/revogar-link-convite.use-case';
import { ListarSorteiosVisiveisParaCompradorUseCase } from '../application/use-cases/listar-sorteios-visiveis-comprador.use-case';
import { CadastrarGrupoDto } from './dto/cadastrar-grupo.dto';
import { ConfigurarAvisosAgenteChatbotDto } from './dto/configurar-avisos-agente-chatbot.dto';

@Controller('grupos')
export class GruposController {
  constructor(
    private readonly cadastrarGrupoUseCase: CadastrarGrupoUseCase,
    private readonly listarGruposDoAdministradorUseCase: ListarGruposDoAdministradorUseCase,
    private readonly buscarGrupoUseCase: BuscarGrupoUseCase,
    private readonly criarAgenteChatbotUseCase: CriarAgenteChatbotUseCase,
    private readonly configurarAvisosAgenteChatbotUseCase: ConfigurarAvisosAgenteChatbotUseCase,
    private readonly desativarAgenteChatbotUseCase: DesativarAgenteChatbotUseCase,
    private readonly listarCompradoresDoGrupoUseCase: ListarCompradoresDoGrupoUseCase,
    private readonly contarSorteiosDoGrupoUseCase: ContarSorteiosDoGrupoUseCase,
    private readonly gerarLinkConviteUseCase: GerarLinkConviteUseCase,
    private readonly validarCodigoConviteUseCase: ValidarCodigoConviteUseCase,
    private readonly revogarLinkConviteUseCase: RevogarLinkConviteUseCase,
    private readonly listarSorteiosVisiveisParaCompradorUseCase: ListarSorteiosVisiveisParaCompradorUseCase,
  ) {}

  @UseGuards(AdministradorGuard)
  @Post()
  async cadastrar(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: CadastrarGrupoDto) {
    return this.cadastrarGrupoUseCase.executar({
      administradorId: usuario.administradorId!,
      nome: dto.nome,
      identificadorWhatsapp: dto.identificadorWhatsapp,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get()
  async listarMeusGrupos(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarGruposDoAdministradorUseCase.executar({
      administradorId: usuario.administradorId!,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':grupoId/agente-chatbot')
  async criarAgenteChatbot(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.criarAgenteChatbotUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Patch(':grupoId/agente-chatbot/avisos')
  async configurarAvisos(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
    @Body() dto: ConfigurarAvisosAgenteChatbotDto,
  ) {
    return this.configurarAvisosAgenteChatbotUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
      ...dto,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':grupoId/agente-chatbot/desativar')
  async desativarAgenteChatbot(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.desativarAgenteChatbotUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':grupoId/compradores')
  async listarCompradores(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.listarCompradoresDoGrupoUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':grupoId/sorteios/contagem')
  async contarSorteios(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.contarSorteiosDoGrupoUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':grupoId/links-convite')
  async gerarLinkConvite(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.gerarLinkConviteUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post('links-convite/:linkConviteId/revogar')
  async revogarLinkConvite(@Param('linkConviteId') linkConviteId: string) {
    return this.revogarLinkConviteUseCase.executar({ linkConviteId });
  }

  @Get('convite/:codigo')
  async validarCodigoConvite(@Param('codigo') codigo: string) {
    return this.validarCodigoConviteUseCase.executar({ codigo });
  }

  @UseGuards(CompradorGuard)
  @Get('sorteios-visiveis')
  async listarSorteiosVisiveis(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarSorteiosVisiveisParaCompradorUseCase.executar({
      grupoId: usuario.grupoId!,
    });
  }

  // Precisa ficar por último entre as rotas GET: ":grupoId" combina com
  // qualquer segmento único e sombrearia "convite/:codigo"/"sorteios-visiveis"
  // se viesse antes.
  @UseGuards(AdministradorGuard)
  @Get(':grupoId')
  async buscarGrupo(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.buscarGrupoUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }
}

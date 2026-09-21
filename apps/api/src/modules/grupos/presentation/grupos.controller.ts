import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarGrupoUseCase } from '../application/use-cases/cadastrar-grupo.use-case';
import { ListarGruposDoAdministradorUseCase } from '../application/use-cases/listar-grupos-administrador.use-case';
import { BuscarGrupoUseCase } from '../application/use-cases/buscar-grupo.use-case';
import { CriarAgenteChatbotUseCase } from '../application/use-cases/criar-agente-chatbot.use-case';
import { ConfigurarAvisosAgenteChatbotUseCase } from '../application/use-cases/configurar-avisos-agente-chatbot.use-case';
import { DesativarAgenteChatbotUseCase } from '../application/use-cases/desativar-agente-chatbot.use-case';
import { ListarCompradoresDoGrupoUseCase } from '../application/use-cases/listar-compradores-grupo.use-case';
import { ContarCampanhasDoGrupoUseCase } from '../application/use-cases/contar-campanhas-grupo.use-case';
import { GerarLinkConviteUseCase } from '../application/use-cases/gerar-link-convite.use-case';
import { ValidarCodigoConviteUseCase } from '../application/use-cases/validar-codigo-convite.use-case';
import { RevogarLinkConviteUseCase } from '../application/use-cases/revogar-link-convite.use-case';
import { ListarCampanhasDoGrupoUseCase } from '../application/use-cases/listar-campanhas-grupo.use-case';
import { LancarCampanhaUseCase } from '../application/use-cases/lancar-campanha.use-case';
import { RankingCotasCompradasUseCase } from '../application/use-cases/ranking-cotas-compradas.use-case';
import { RankingVencedoresUseCase } from '../application/use-cases/ranking-vencedores.use-case';
import { ListarAlertasAutomaticosUseCase } from '../application/use-cases/listar-alertas-automaticos.use-case';
import { CadastrarGrupoDto } from './dto/cadastrar-grupo.dto';
import { ConfigurarAvisosAgenteChatbotDto } from './dto/configurar-avisos-agente-chatbot.dto';
import { LancarCampanhaDto } from './dto/lancar-campanha.dto';

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
    private readonly contarCampanhasDoGrupoUseCase: ContarCampanhasDoGrupoUseCase,
    private readonly gerarLinkConviteUseCase: GerarLinkConviteUseCase,
    private readonly validarCodigoConviteUseCase: ValidarCodigoConviteUseCase,
    private readonly revogarLinkConviteUseCase: RevogarLinkConviteUseCase,
    private readonly listarCampanhasDoGrupoUseCase: ListarCampanhasDoGrupoUseCase,
    private readonly lancarCampanhaUseCase: LancarCampanhaUseCase,
    private readonly rankingCotasCompradasUseCase: RankingCotasCompradasUseCase,
    private readonly rankingVencedoresUseCase: RankingVencedoresUseCase,
    private readonly listarAlertasAutomaticosUseCase: ListarAlertasAutomaticosUseCase,
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

  // Precisa ficar antes de ":grupoId" entre as rotas GET: ver comentário mais
  // abaixo sobre por que ":grupoId" tem que ser o último.
  @UseGuards(AdministradorGuard)
  @Get('alertas-automaticos')
  async listarAlertasAutomaticos(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarAlertasAutomaticosUseCase.executar({
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
  @Get(':grupoId/campanhas/contagem')
  async contarCampanhas(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.contarCampanhasDoGrupoUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':grupoId/campanhas')
  async listarCampanhasDoGrupo(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.listarCampanhasDoGrupoUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':grupoId/campanhas/:campanhaId/lancar')
  async lancarCampanha(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
    @Param('campanhaId') campanhaId: string,
    @Body() dto: LancarCampanhaDto,
  ) {
    return this.lancarCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
      campanhaId,
      dataAberturaVendas: new Date(dto.dataAberturaVendas),
      dataEncerramentoVendas: dto.dataEncerramentoVendas ? new Date(dto.dataEncerramentoVendas) : null,
      dataRealizacao: dto.dataRealizacao ? new Date(dto.dataRealizacao) : null,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':grupoId/ranking/cotas-compradas')
  async rankingCotasCompradas(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.rankingCotasCompradasUseCase.executar({
      administradorId: usuario.administradorId!,
      grupoId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':grupoId/ranking/vencedores')
  async rankingVencedores(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('grupoId') grupoId: string,
  ) {
    return this.rankingVencedoresUseCase.executar({
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

  // Precisa ficar por último entre as rotas GET: ":grupoId" combina com
  // qualquer segmento único e sombrearia "convite/:codigo"/"alertas-automaticos"
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

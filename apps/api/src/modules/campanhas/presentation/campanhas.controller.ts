import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { AdministradorOuOperadorGuard } from '../../../shared/auth/guards/administrador-ou-operador.guard';
import { CompradorGuard } from '../../../shared/auth/guards/comprador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CriarCampanhaUseCase } from '../application/use-cases/criar-campanha.use-case';
import { ListarCampanhasDoAdministradorUseCase } from '../application/use-cases/listar-campanhas-administrador.use-case';
import { BuscarCampanhaUseCase } from '../application/use-cases/buscar-campanha.use-case';
import { MarcarCampanhaComoRevisadaUseCase } from '../application/use-cases/marcar-campanha-como-revisada.use-case';
import { FinalizarCampanhaUseCase } from '../application/use-cases/finalizar-campanha.use-case';
import { RemoverCampanhaUseCase } from '../application/use-cases/remover-campanha.use-case';
import { RestaurarCampanhaUseCase } from '../application/use-cases/restaurar-campanha.use-case';
import { ListarCampanhasVisiveisParaCompradorUseCase } from '../application/use-cases/listar-campanhas-visiveis-comprador.use-case';
import { ListarCotasDaCampanhaUseCase } from '../application/use-cases/listar-cotas-campanha.use-case';
import { ReservarCotaUseCase } from '../application/use-cases/reservar-cota.use-case';
import { ReservarLoteCotasUseCase } from '../application/use-cases/reservar-lote-cotas.use-case';
import { CriarCampanhaDto } from './dto/criar-campanha.dto';
import { FinalizarCampanhaDto } from './dto/finalizar-campanha.dto';
import { ReservarCotaDto } from './dto/reservar-cota.dto';
import { ReservarLoteCotasDto } from './dto/reservar-lote-cotas.dto';

@Controller('campanhas')
export class CampanhasController {
  constructor(
    private readonly criarCampanhaUseCase: CriarCampanhaUseCase,
    private readonly listarCampanhasDoAdministradorUseCase: ListarCampanhasDoAdministradorUseCase,
    private readonly buscarCampanhaUseCase: BuscarCampanhaUseCase,
    private readonly marcarCampanhaComoRevisadaUseCase: MarcarCampanhaComoRevisadaUseCase,
    private readonly finalizarCampanhaUseCase: FinalizarCampanhaUseCase,
    private readonly removerCampanhaUseCase: RemoverCampanhaUseCase,
    private readonly restaurarCampanhaUseCase: RestaurarCampanhaUseCase,
    private readonly listarCampanhasVisiveisParaCompradorUseCase: ListarCampanhasVisiveisParaCompradorUseCase,
    private readonly listarCotasDaCampanhaUseCase: ListarCotasDaCampanhaUseCase,
    private readonly reservarCotaUseCase: ReservarCotaUseCase,
    private readonly reservarLoteCotasUseCase: ReservarLoteCotasUseCase,
  ) {}

  @UseGuards(AdministradorGuard)
  @Post()
  async criar(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: CriarCampanhaDto) {
    return this.criarCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      nome: dto.nome,
      descricao: dto.descricao,
      telefoneSuporte: dto.telefoneSuporte,
      premioIds: dto.premioIds,
      quantidadeCotas: dto.quantidadeCotas,
      valorCota: dto.valorCota,
      formaVenda: dto.formaVenda,
      quantidadeMinimaPorCompra: dto.quantidadeMinimaPorCompra,
      quantidadeMaximaPorCompra: dto.quantidadeMaximaPorCompra,
      expiracaoReservaMinutos: dto.expiracaoReservaMinutos,
      reservaExigeEmail: dto.reservaExigeEmail,
      reservaExigeNome: dto.reservaExigeNome,
      reservaExigeTelefone: dto.reservaExigeTelefone,
      reservaExigeConfirmacaoTelefone: dto.reservaExigeConfirmacaoTelefone,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get()
  async listarMinhas(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarCampanhasDoAdministradorUseCase.executar({
      administradorId: usuario.administradorId!,
    });
  }

  // Precisa ficar antes de ":campanhaId" entre as rotas GET: um segmento
  // literal só é encontrado primeiro se estiver registrado antes do catch-all.
  @UseGuards(CompradorGuard)
  @Get('visiveis')
  async listarVisiveis(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarCampanhasVisiveisParaCompradorUseCase.executar({
      grupoId: usuario.grupoId!,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':campanhaId')
  async buscar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.buscarCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':campanhaId/marcar-revisada')
  async marcarComoRevisada(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.marcarCampanhaComoRevisadaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
    });
  }

  @UseGuards(AdministradorOuOperadorGuard)
  @Post(':campanhaId/finalizar')
  async finalizar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
    @Body() dto: FinalizarCampanhaDto,
  ) {
    return this.finalizarCampanhaUseCase.executar({
      administradorId: usuario.administradorId,
      operadorId: usuario.operadorId,
      campanhaId,
      cotaVencedoraNumero: dto.cotaVencedoraNumero,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':campanhaId/remover')
  async remover(@CurrentUser() usuario: PrincipalAutenticado, @Param('campanhaId') campanhaId: string) {
    return this.removerCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':campanhaId/restaurar')
  async restaurar(@CurrentUser() usuario: PrincipalAutenticado, @Param('campanhaId') campanhaId: string) {
    return this.restaurarCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
    });
  }

  @UseGuards(CompradorGuard)
  @Get(':campanhaId/cotas')
  async listarCotas(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.listarCotasDaCampanhaUseCase.executar({
      campanhaId,
      grupoId: usuario.grupoId!,
      compradorId: usuario.compradorId!,
    });
  }

  @UseGuards(CompradorGuard)
  @Post(':campanhaId/cotas/reservar')
  async reservarCota(
    @Param('campanhaId') campanhaId: string,
    @Body() dto: ReservarCotaDto,
    @CurrentUser() usuario: PrincipalAutenticado,
  ) {
    return this.reservarCotaUseCase.executar({
      campanhaId,
      numero: dto.numero,
      compradorId: usuario.compradorId!,
    });
  }

  @UseGuards(CompradorGuard)
  @Post(':campanhaId/cotas/reservar-lote')
  async reservarLoteCotas(
    @Param('campanhaId') campanhaId: string,
    @Body() dto: ReservarLoteCotasDto,
    @CurrentUser() usuario: PrincipalAutenticado,
  ) {
    return this.reservarLoteCotasUseCase.executar({
      campanhaId,
      compradorId: usuario.compradorId!,
      numeros: dto.numeros,
      quantidadeAleatoria: dto.quantidadeAleatoria,
    });
  }
}

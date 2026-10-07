import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { AdministradorOuOperadorGuard } from '../../../shared/auth/guards/administrador-ou-operador.guard';
import { CompradorGuard } from '../../../shared/auth/guards/comprador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CriarCampanhaUseCase } from '../application/use-cases/criar-campanha.use-case';
import { EditarCampanhaUseCase } from '../application/use-cases/editar-campanha.use-case';
import { ListarCampanhasDoAdministradorUseCase } from '../application/use-cases/listar-campanhas-administrador.use-case';
import { BuscarCampanhaUseCase } from '../application/use-cases/buscar-campanha.use-case';
import { BuscarCampanhaPublicaUseCase } from '../application/use-cases/buscar-campanha-publica.use-case';
import { ListarCotasPublicasCampanhaUseCase } from '../application/use-cases/listar-cotas-publicas-campanha.use-case';
import { MarcarCampanhaComoRevisadaUseCase } from '../application/use-cases/marcar-campanha-como-revisada.use-case';
import { FinalizarCampanhaUseCase } from '../application/use-cases/finalizar-campanha.use-case';
import { RemoverCampanhaUseCase } from '../application/use-cases/remover-campanha.use-case';
import { RestaurarCampanhaUseCase } from '../application/use-cases/restaurar-campanha.use-case';
import { ListarCampanhasVisiveisParaCompradorUseCase } from '../application/use-cases/listar-campanhas-visiveis-comprador.use-case';
import { ListarCotasDaCampanhaUseCase } from '../application/use-cases/listar-cotas-campanha.use-case';
import { ReservarCotaUseCase } from '../application/use-cases/reservar-cota.use-case';
import { ReservarLoteCotasUseCase } from '../application/use-cases/reservar-lote-cotas.use-case';
import { ReservarLoteCotasConvidadoUseCase } from '../application/use-cases/reservar-lote-cotas-convidado.use-case';
import { AtualizarFotoCampanhaUseCase } from '../application/use-cases/atualizar-foto-campanha.use-case';
import { ListarCotasParaAdministradorUseCase } from '../application/use-cases/listar-cotas-administrador.use-case';
import { ConfirmarPagamentoManualUseCase } from '../application/use-cases/confirmar-pagamento-manual.use-case';
import { LiberarCotasReservadasUseCase } from '../application/use-cases/liberar-cotas-reservadas.use-case';
import { CancelarMinhaReservaUseCase } from '../application/use-cases/cancelar-minha-reserva.use-case';
import { TIPOS_IMAGEM_PERMITIDOS } from '../domain/services/validacoes-imagem-campanha';
import { CriarCampanhaDto } from './dto/criar-campanha.dto';
import { EditarCampanhaDto } from './dto/editar-campanha.dto';
import { FinalizarCampanhaDto } from './dto/finalizar-campanha.dto';
import { ReservarCotaDto } from './dto/reservar-cota.dto';
import { ReservarLoteCotasDto } from './dto/reservar-lote-cotas.dto';
import { ReservarLoteCotasConvidadoDto } from './dto/reservar-lote-cotas-convidado.dto';
import { GerenciarCotaCompradorDto } from './dto/gerenciar-cota-comprador.dto';

const TAMANHO_MAXIMO_UPLOAD_BYTES = 5 * 1024 * 1024; // teto de segurança acima do limite de negócio (3MB)

@Controller('campanhas')
export class CampanhasController {
  constructor(
    private readonly criarCampanhaUseCase: CriarCampanhaUseCase,
    private readonly editarCampanhaUseCase: EditarCampanhaUseCase,
    private readonly listarCampanhasDoAdministradorUseCase: ListarCampanhasDoAdministradorUseCase,
    private readonly buscarCampanhaUseCase: BuscarCampanhaUseCase,
    private readonly buscarCampanhaPublicaUseCase: BuscarCampanhaPublicaUseCase,
    private readonly listarCotasPublicasCampanhaUseCase: ListarCotasPublicasCampanhaUseCase,
    private readonly marcarCampanhaComoRevisadaUseCase: MarcarCampanhaComoRevisadaUseCase,
    private readonly finalizarCampanhaUseCase: FinalizarCampanhaUseCase,
    private readonly removerCampanhaUseCase: RemoverCampanhaUseCase,
    private readonly restaurarCampanhaUseCase: RestaurarCampanhaUseCase,
    private readonly listarCampanhasVisiveisParaCompradorUseCase: ListarCampanhasVisiveisParaCompradorUseCase,
    private readonly listarCotasDaCampanhaUseCase: ListarCotasDaCampanhaUseCase,
    private readonly reservarCotaUseCase: ReservarCotaUseCase,
    private readonly reservarLoteCotasUseCase: ReservarLoteCotasUseCase,
    private readonly reservarLoteCotasConvidadoUseCase: ReservarLoteCotasConvidadoUseCase,
    private readonly atualizarFotoCampanhaUseCase: AtualizarFotoCampanhaUseCase,
    private readonly listarCotasParaAdministradorUseCase: ListarCotasParaAdministradorUseCase,
    private readonly confirmarPagamentoManualUseCase: ConfirmarPagamentoManualUseCase,
    private readonly liberarCotasReservadasUseCase: LiberarCotasReservadasUseCase,
    private readonly cancelarMinhaReservaUseCase: CancelarMinhaReservaUseCase,
  ) {}

  @UseGuards(AdministradorGuard)
  @Post()
  async criar(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: CriarCampanhaDto) {
    return this.criarCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      nome: dto.nome,
      descricao: dto.descricao,
      telefoneSuporte: dto.telefoneSuporte,
      tipoChavePix: dto.tipoChavePix,
      chavePix: dto.chavePix,
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
      reservaExigeCpf: dto.reservaExigeCpf,
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

  // Sem guard de propósito: é o "Link de Vendas" compartilhado com quem ainda
  // não tem conta — só existe pra campanhas já lançadas pra um grupo (ver
  // BuscarCampanhaPublicaUseCase) e nunca inclui dados sensíveis (chave Pix,
  // vencedor, IDs internos). Precisa ficar antes de ":campanhaId" pelo mesmo
  // motivo do comentário acima em "visiveis".
  @Get(':campanhaId/publica')
  async buscarPublica(@Param('campanhaId') campanhaId: string) {
    return this.buscarCampanhaPublicaUseCase.executar({ campanhaId });
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
  @Patch(':campanhaId')
  async editar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
    @Body() dto: EditarCampanhaDto,
  ) {
    return this.editarCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
      nome: dto.nome,
      descricao: dto.descricao,
      telefoneSuporte: dto.telefoneSuporte,
      tipoChavePix: dto.tipoChavePix,
      chavePix: dto.chavePix,
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
      reservaExigeCpf: dto.reservaExigeCpf,
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
      vencedorNome: dto.vencedorNome,
      vencedorTelefone: dto.vencedorTelefone,
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

  @UseGuards(AdministradorGuard)
  @Post(':campanhaId/foto')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_UPLOAD_BYTES },
      fileFilter: (_req, arquivo, callback) => {
        if (!TIPOS_IMAGEM_PERMITIDOS.includes(arquivo.mimetype)) {
          callback(new BadRequestException('A imagem deve estar em um dos formatos: JPEG, PNG, SVG, WEBP, GIF ou HEIC.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async atualizarFoto(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Envie um arquivo de imagem no campo "foto".');
    }
    return this.atualizarFotoCampanhaUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
      buffer: arquivo.buffer,
      mimetype: arquivo.mimetype,
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

  // Mesma ideia de ":campanhaId/publica": mapa de cotas pra quem abriu o
  // Link de Vendas sem conta ainda, sem "minhaCota"/"reservaExpiraEm" (não
  // existe identidade de comprador aqui) e sem expor de quem é cada cota.
  @Get(':campanhaId/cotas/publica')
  async listarCotasPublicas(@Param('campanhaId') campanhaId: string) {
    return this.listarCotasPublicasCampanhaUseCase.executar({ campanhaId });
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
      grupoId: usuario.grupoId!,
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
      grupoId: usuario.grupoId!,
      compradorId: usuario.compradorId!,
      numeros: dto.numeros,
      quantidadeAleatoria: dto.quantidadeAleatoria,
    });
  }

  // Sem guard de propósito: reserva feita sem login pelo Link de Vendas — ver
  // ReservarLoteCotasConvidadoUseCase. Guarda o contato direto na cota, sem
  // criar Comprador.
  @Post(':campanhaId/cotas/reservar-lote-convidado')
  async reservarLoteCotasConvidado(
    @Param('campanhaId') campanhaId: string,
    @Body() dto: ReservarLoteCotasConvidadoDto,
  ) {
    return this.reservarLoteCotasConvidadoUseCase.executar({
      campanhaId,
      numeros: dto.numeros,
      quantidadeAleatoria: dto.quantidadeAleatoria,
      nome: dto.nome,
      email: dto.email,
      telefone: dto.telefone,
      confirmacaoTelefone: dto.confirmacaoTelefone,
      cpf: dto.cpf,
    });
  }

  @UseGuards(CompradorGuard)
  @Post(':campanhaId/cotas/cancelar-reserva')
  async cancelarMinhaReserva(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.cancelarMinhaReservaUseCase.executar({
      campanhaId,
      grupoId: usuario.grupoId!,
      compradorId: usuario.compradorId!,
    });
  }

  // Visão administrativa do mapa de cotas (com nome/telefone do comprador) —
  // distinta de GET ":campanhaId/cotas", que é a visão do próprio comprador
  // e nunca expõe dados de terceiros.
  @UseGuards(AdministradorGuard)
  @Get(':campanhaId/cotas/admin')
  async listarCotasParaAdministrador(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
  ) {
    return this.listarCotasParaAdministradorUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':campanhaId/cotas/confirmar-pagamento')
  async confirmarPagamentoManual(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
    @Body() dto: GerenciarCotaCompradorDto,
  ) {
    return this.confirmarPagamentoManualUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
      compradorId: dto.compradorId,
      tokenReservaConvidado: dto.tokenReservaConvidado,
    });
  }

  @UseGuards(AdministradorGuard)
  @Post(':campanhaId/cotas/liberar')
  async liberarCotasReservadas(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('campanhaId') campanhaId: string,
    @Body() dto: GerenciarCotaCompradorDto,
  ) {
    return this.liberarCotasReservadasUseCase.executar({
      administradorId: usuario.administradorId!,
      campanhaId,
      compradorId: dto.compradorId,
      tokenReservaConvidado: dto.tokenReservaConvidado,
    });
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarPremioUseCase } from '../application/use-cases/cadastrar-premio.use-case';
import { EditarPremioUseCase } from '../application/use-cases/editar-premio.use-case';
import { ListarPremiosDoAdministradorUseCase } from '../application/use-cases/listar-premios-administrador.use-case';
import { AtualizarFotoPremioUseCase } from '../application/use-cases/atualizar-foto-premio.use-case';
import { ExcluirPremioUseCase } from '../application/use-cases/excluir-premio.use-case';
import { TIPOS_IMAGEM_PERMITIDOS } from '../domain/services/validacoes-imagem-premio';
import { CadastrarPremioDto } from './dto/cadastrar-premio.dto';
import { EditarPremioDto } from './dto/editar-premio.dto';

// Teto de segurança acima do limite de negócio (3MB, validado no use case
// com mensagem amigável) — só existe para não deixar a memória do processo
// exposta a uploads absurdamente grandes.
const TAMANHO_MAXIMO_UPLOAD_BYTES = 5 * 1024 * 1024;

@UseGuards(AdministradorGuard)
@Controller('premios')
export class PremiosController {
  constructor(
    private readonly cadastrarPremioUseCase: CadastrarPremioUseCase,
    private readonly editarPremioUseCase: EditarPremioUseCase,
    private readonly listarPremiosDoAdministradorUseCase: ListarPremiosDoAdministradorUseCase,
    private readonly atualizarFotoPremioUseCase: AtualizarFotoPremioUseCase,
    private readonly excluirPremioUseCase: ExcluirPremioUseCase,
  ) {}

  @Post()
  async cadastrar(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: CadastrarPremioDto) {
    return this.cadastrarPremioUseCase.executar({
      administradorId: usuario.administradorId!,
      ...dto,
    });
  }

  @Get()
  async listarMeusPremios(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarPremiosDoAdministradorUseCase.executar({
      administradorId: usuario.administradorId!,
    });
  }

  @Patch(':premioId')
  async editar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('premioId') premioId: string,
    @Body() dto: EditarPremioDto,
  ) {
    return this.editarPremioUseCase.executar({
      administradorId: usuario.administradorId!,
      premioId,
      ...dto,
    });
  }

  @Delete(':premioId')
  async excluir(@CurrentUser() usuario: PrincipalAutenticado, @Param('premioId') premioId: string) {
    return this.excluirPremioUseCase.executar({
      administradorId: usuario.administradorId!,
      premioId,
    });
  }

  @Post(':premioId/foto')
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
    @Param('premioId') premioId: string,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Envie um arquivo de imagem no campo "foto".');
    }

    return this.atualizarFotoPremioUseCase.executar({
      administradorId: usuario.administradorId!,
      premioId,
      buffer: arquivo.buffer,
      mimetype: arquivo.mimetype,
    });
  }
}

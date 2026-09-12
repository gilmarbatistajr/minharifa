import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarPremioUseCase } from '../application/use-cases/cadastrar-premio.use-case';
import { EditarPremioUseCase } from '../application/use-cases/editar-premio.use-case';
import { ListarPremiosDoAdministradorUseCase } from '../application/use-cases/listar-premios-administrador.use-case';
import { CadastrarPremioDto } from './dto/cadastrar-premio.dto';
import { EditarPremioDto } from './dto/editar-premio.dto';

@UseGuards(AdministradorGuard)
@Controller('premios')
export class PremiosController {
  constructor(
    private readonly cadastrarPremioUseCase: CadastrarPremioUseCase,
    private readonly editarPremioUseCase: EditarPremioUseCase,
    private readonly listarPremiosDoAdministradorUseCase: ListarPremiosDoAdministradorUseCase,
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
}

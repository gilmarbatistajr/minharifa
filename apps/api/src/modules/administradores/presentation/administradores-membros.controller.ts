import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarAdministradorMembroUseCase } from '../application/use-cases/cadastrar-administrador-membro.use-case';
import { EditarAdministradorMembroUseCase } from '../application/use-cases/editar-administrador-membro.use-case';
import { ListarAdministradoresMembrosUseCase } from '../application/use-cases/listar-administradores-membros.use-case';
import { BuscarAdministradorMembroUseCase } from '../application/use-cases/buscar-administrador-membro.use-case';
import { ExcluirAdministradorMembroUseCase } from '../application/use-cases/excluir-administrador-membro.use-case';
import { CadastrarAdministradorMembroDto } from './dto/cadastrar-administrador-membro.dto';
import { EditarAdministradorMembroDto } from './dto/editar-administrador-membro.dto';

@UseGuards(AdministradorGuard)
@Controller('administradores/membros')
export class AdministradoresMembrosController {
  constructor(
    private readonly cadastrarAdministradorMembroUseCase: CadastrarAdministradorMembroUseCase,
    private readonly editarAdministradorMembroUseCase: EditarAdministradorMembroUseCase,
    private readonly listarAdministradoresMembrosUseCase: ListarAdministradoresMembrosUseCase,
    private readonly buscarAdministradorMembroUseCase: BuscarAdministradorMembroUseCase,
    private readonly excluirAdministradorMembroUseCase: ExcluirAdministradorMembroUseCase,
  ) {}

  @Post()
  async cadastrar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Body() dto: CadastrarAdministradorMembroDto,
  ) {
    return this.cadastrarAdministradorMembroUseCase.executar({
      administradorId: usuario.administradorId!,
      ...dto,
    });
  }

  @Get()
  async listar(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarAdministradoresMembrosUseCase.executar({
      administradorId: usuario.administradorId!,
    });
  }

  @Get(':membroId')
  async buscar(@CurrentUser() usuario: PrincipalAutenticado, @Param('membroId') membroId: string) {
    return this.buscarAdministradorMembroUseCase.executar({
      administradorId: usuario.administradorId!,
      membroId,
    });
  }

  @Patch(':membroId')
  async editar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('membroId') membroId: string,
    @Body() dto: EditarAdministradorMembroDto,
  ) {
    return this.editarAdministradorMembroUseCase.executar({
      administradorId: usuario.administradorId!,
      membroId,
      ...dto,
    });
  }

  @Delete(':membroId')
  async excluir(@CurrentUser() usuario: PrincipalAutenticado, @Param('membroId') membroId: string) {
    return this.excluirAdministradorMembroUseCase.executar({
      administradorId: usuario.administradorId!,
      membroId,
    });
  }
}

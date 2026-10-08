import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../../../shared/auth/guards/administrador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { CadastrarOperadorUseCase } from '../application/use-cases/cadastrar-operador.use-case';
import { EditarOperadorUseCase } from '../application/use-cases/editar-operador.use-case';
import { ListarOperadoresDoAdministradorUseCase } from '../application/use-cases/listar-operadores-administrador.use-case';
import { BuscarOperadorUseCase } from '../application/use-cases/buscar-operador.use-case';
import { ExcluirOperadorUseCase } from '../application/use-cases/excluir-operador.use-case';
import { LoginOperadorUseCase } from '../application/use-cases/login-operador.use-case';
import { CadastrarOperadorDto } from './dto/cadastrar-operador.dto';
import { EditarOperadorDto } from './dto/editar-operador.dto';
import { LoginOperadorDto } from './dto/login-operador.dto';

@Controller('operadores')
export class OperadoresController {
  constructor(
    private readonly cadastrarOperadorUseCase: CadastrarOperadorUseCase,
    private readonly editarOperadorUseCase: EditarOperadorUseCase,
    private readonly listarOperadoresDoAdministradorUseCase: ListarOperadoresDoAdministradorUseCase,
    private readonly buscarOperadorUseCase: BuscarOperadorUseCase,
    private readonly excluirOperadorUseCase: ExcluirOperadorUseCase,
    private readonly loginOperadorUseCase: LoginOperadorUseCase,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginOperadorDto) {
    return this.loginOperadorUseCase.executar(dto);
  }

  @UseGuards(AdministradorGuard)
  @Post()
  async cadastrar(@CurrentUser() usuario: PrincipalAutenticado, @Body() dto: CadastrarOperadorDto) {
    return this.cadastrarOperadorUseCase.executar({
      administradorId: usuario.administradorId!,
      ...dto,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get()
  async listarMeusOperadores(@CurrentUser() usuario: PrincipalAutenticado) {
    return this.listarOperadoresDoAdministradorUseCase.executar({
      administradorId: usuario.administradorId!,
    });
  }

  @UseGuards(AdministradorGuard)
  @Get(':operadorId')
  async buscar(@CurrentUser() usuario: PrincipalAutenticado, @Param('operadorId') operadorId: string) {
    return this.buscarOperadorUseCase.executar({
      administradorId: usuario.administradorId!,
      operadorId,
    });
  }

  @UseGuards(AdministradorGuard)
  @Patch(':operadorId')
  async editar(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('operadorId') operadorId: string,
    @Body() dto: EditarOperadorDto,
  ) {
    return this.editarOperadorUseCase.executar({
      administradorId: usuario.administradorId!,
      operadorId,
      ...dto,
    });
  }

  @UseGuards(AdministradorGuard)
  @Delete(':operadorId')
  async excluir(@CurrentUser() usuario: PrincipalAutenticado, @Param('operadorId') operadorId: string) {
    return this.excluirOperadorUseCase.executar({
      administradorId: usuario.administradorId!,
      operadorId,
    });
  }
}

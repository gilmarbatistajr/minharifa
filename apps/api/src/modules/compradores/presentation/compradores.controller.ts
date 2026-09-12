import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CadastrarCompradorUseCase } from '../application/use-cases/cadastrar-comprador.use-case';
import { LoginCompradorUseCase } from '../application/use-cases/login-comprador.use-case';
import { SolicitarRecuperacaoSenhaCompradorUseCase } from '../application/use-cases/solicitar-recuperacao-senha-comprador.use-case';
import { RedefinirSenhaCompradorUseCase } from '../application/use-cases/redefinir-senha-comprador.use-case';
import { BuscarCompradorPorCpfUseCase } from '../application/use-cases/buscar-comprador-por-cpf.use-case';
import { CadastrarCompradorDto } from './dto/cadastrar-comprador.dto';
import { LoginCompradorDto } from './dto/login-comprador.dto';
import { SolicitarRecuperacaoSenhaDto } from './dto/solicitar-recuperacao-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';

@Controller('compradores')
export class CompradoresController {
  constructor(
    private readonly cadastrarCompradorUseCase: CadastrarCompradorUseCase,
    private readonly loginCompradorUseCase: LoginCompradorUseCase,
    private readonly solicitarRecuperacaoSenhaUseCase: SolicitarRecuperacaoSenhaCompradorUseCase,
    private readonly redefinirSenhaUseCase: RedefinirSenhaCompradorUseCase,
    private readonly buscarCompradorPorCpfUseCase: BuscarCompradorPorCpfUseCase,
  ) {}

  @Post()
  async cadastrar(@Body() dto: CadastrarCompradorDto) {
    return this.cadastrarCompradorUseCase.executar({
      ...dto,
      dataNascimento: new Date(dto.dataNascimento),
    });
  }

  @Post('login')
  async login(@Body() dto: LoginCompradorDto) {
    return this.loginCompradorUseCase.executar(dto);
  }

  @Post('recuperar-senha')
  async solicitarRecuperacaoSenha(@Body() dto: SolicitarRecuperacaoSenhaDto) {
    return this.solicitarRecuperacaoSenhaUseCase.executar(dto);
  }

  @Post('redefinir-senha')
  async redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.redefinirSenhaUseCase.executar(dto);
  }

  @Get('cpf/:cpf')
  async buscarPorCpf(@Param('cpf') cpf: string) {
    return this.buscarCompradorPorCpfUseCase.executar({ cpf });
  }
}

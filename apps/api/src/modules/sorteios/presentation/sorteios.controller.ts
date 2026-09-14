import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CompradorGuard } from '../../../shared/auth/guards/comprador.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PrincipalAutenticado } from '../../../shared/auth/jwt-payload.interface';
import { ReservarCotaUseCase } from '../application/use-cases/reservar-cota.use-case';
import { ReservarLoteCotasUseCase } from '../application/use-cases/reservar-lote-cotas.use-case';
import { ListarCotasDoSorteioUseCase } from '../application/use-cases/listar-cotas-sorteio.use-case';
import { ReservarCotaDto } from './dto/reservar-cota.dto';
import { ReservarLoteCotasDto } from './dto/reservar-lote-cotas.dto';

@UseGuards(CompradorGuard)
@Controller('sorteios')
export class SorteiosController {
  constructor(
    private readonly reservarCotaUseCase: ReservarCotaUseCase,
    private readonly reservarLoteCotasUseCase: ReservarLoteCotasUseCase,
    private readonly listarCotasDoSorteioUseCase: ListarCotasDoSorteioUseCase,
  ) {}

  @Get(':sorteioId/cotas')
  async listarCotas(
    @CurrentUser() usuario: PrincipalAutenticado,
    @Param('sorteioId') sorteioId: string,
  ) {
    return this.listarCotasDoSorteioUseCase.executar({
      sorteioId,
      grupoId: usuario.grupoId!,
      compradorId: usuario.compradorId!,
    });
  }

  @Post(':sorteioId/cotas/reservar')
  async reservarCota(
    @Param('sorteioId') sorteioId: string,
    @Body() dto: ReservarCotaDto,
    @CurrentUser() usuario: PrincipalAutenticado,
  ) {
    return this.reservarCotaUseCase.executar({
      sorteioId,
      numero: dto.numero,
      compradorId: usuario.compradorId!,
    });
  }

  @Post(':sorteioId/cotas/reservar-lote')
  async reservarLoteCotas(
    @Param('sorteioId') sorteioId: string,
    @Body() dto: ReservarLoteCotasDto,
    @CurrentUser() usuario: PrincipalAutenticado,
  ) {
    return this.reservarLoteCotasUseCase.executar({
      sorteioId,
      compradorId: usuario.compradorId!,
      numeros: dto.numeros,
      quantidadeAleatoria: dto.quantidadeAleatoria,
    });
  }
}

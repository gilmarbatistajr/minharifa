import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservarCotaUseCase } from '../application/use-cases/reservar-cota.use-case';
import { ReservarCotaDto } from './dto/reservar-cota.dto';

@Controller('sorteios')
export class SorteiosController {
  constructor(private readonly reservarCotaUseCase: ReservarCotaUseCase) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':sorteioId/cotas/reservar')
  async reservarCota(
    @Param('sorteioId') sorteioId: string,
    @Body() dto: ReservarCotaDto,
    @Req() req: { user: { compradorId: string } },
  ) {
    return this.reservarCotaUseCase.executar({
      sorteioId,
      numero: dto.numero,
      compradorId: req.user.compradorId,
    });
  }
}

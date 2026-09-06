import { Module } from '@nestjs/common';
import { COTA_REPOSITORY } from './domain/repositories/cota.repository';
import { SORTEIO_REPOSITORY } from './domain/repositories/sorteio.repository';
import { PrismaCotaRepository } from './infrastructure/prisma-cota.repository';
import { PrismaSorteioRepository } from './infrastructure/prisma-sorteio.repository';
import { ReservarCotaUseCase } from './application/use-cases/reservar-cota.use-case';
import { SorteiosController } from './presentation/sorteios.controller';

@Module({
  controllers: [SorteiosController],
  providers: [
    ReservarCotaUseCase,
    { provide: COTA_REPOSITORY, useClass: PrismaCotaRepository },
    { provide: SORTEIO_REPOSITORY, useClass: PrismaSorteioRepository },
  ],
  exports: [COTA_REPOSITORY, SORTEIO_REPOSITORY],
})
export class SorteiosModule {}

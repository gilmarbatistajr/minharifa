import { Module } from '@nestjs/common';
import { SorteiosModule } from '../sorteios/sorteios.module';
import { PREMIO_REPOSITORY } from './domain/repositories/premio.repository';
import { PrismaPremioRepository } from './infrastructure/prisma-premio.repository';
import { CadastrarPremioUseCase } from './application/use-cases/cadastrar-premio.use-case';
import { EditarPremioUseCase } from './application/use-cases/editar-premio.use-case';
import { ListarPremiosDoAdministradorUseCase } from './application/use-cases/listar-premios-administrador.use-case';
import { PremiosController } from './presentation/premios.controller';

@Module({
  imports: [SorteiosModule],
  controllers: [PremiosController],
  providers: [
    { provide: PREMIO_REPOSITORY, useClass: PrismaPremioRepository },
    CadastrarPremioUseCase,
    EditarPremioUseCase,
    ListarPremiosDoAdministradorUseCase,
  ],
  exports: [PREMIO_REPOSITORY],
})
export class PremiosModule {}

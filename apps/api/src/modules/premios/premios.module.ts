import { Module, forwardRef } from '@nestjs/common';
import { CampanhasModule } from '../campanhas/campanhas.module';
import { PREMIO_REPOSITORY } from './domain/repositories/premio.repository';
import { PrismaPremioRepository } from './infrastructure/prisma-premio.repository';
import { CadastrarPremioUseCase } from './application/use-cases/cadastrar-premio.use-case';
import { EditarPremioUseCase } from './application/use-cases/editar-premio.use-case';
import { ListarPremiosDoAdministradorUseCase } from './application/use-cases/listar-premios-administrador.use-case';
import { AtualizarFotoPremioUseCase } from './application/use-cases/atualizar-foto-premio.use-case';
import { ExcluirPremioUseCase } from './application/use-cases/excluir-premio.use-case';
import { PremiosController } from './presentation/premios.controller';

@Module({
  // forwardRef: ver comentário equivalente em campanhas.module.ts.
  imports: [forwardRef(() => CampanhasModule)],
  controllers: [PremiosController],
  providers: [
    { provide: PREMIO_REPOSITORY, useClass: PrismaPremioRepository },
    CadastrarPremioUseCase,
    EditarPremioUseCase,
    ListarPremiosDoAdministradorUseCase,
    AtualizarFotoPremioUseCase,
    ExcluirPremioUseCase,
  ],
  exports: [PREMIO_REPOSITORY],
})
export class PremiosModule {}

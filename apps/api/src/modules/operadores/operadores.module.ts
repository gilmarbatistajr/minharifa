import { Module, forwardRef } from '@nestjs/common';
import { GruposModule } from '../grupos/grupos.module';
import { OPERADOR_REPOSITORY } from './domain/repositories/operador.repository';
import { PrismaOperadorRepository } from './infrastructure/prisma-operador.repository';
import { CadastrarOperadorUseCase } from './application/use-cases/cadastrar-operador.use-case';
import { EditarOperadorUseCase } from './application/use-cases/editar-operador.use-case';
import { ListarOperadoresDoAdministradorUseCase } from './application/use-cases/listar-operadores-administrador.use-case';
import { BuscarOperadorUseCase } from './application/use-cases/buscar-operador.use-case';
import { ExcluirOperadorUseCase } from './application/use-cases/excluir-operador.use-case';
import { LoginOperadorUseCase } from './application/use-cases/login-operador.use-case';
import { OperadoresController } from './presentation/operadores.controller';

@Module({
  // forwardRef: GruposModule importa CampanhasModule, que agora importa este
  // módulo de volta (FinalizarCampanhaUseCase resolve o operador que finaliza).
  imports: [forwardRef(() => GruposModule)],
  controllers: [OperadoresController],
  providers: [
    { provide: OPERADOR_REPOSITORY, useClass: PrismaOperadorRepository },
    CadastrarOperadorUseCase,
    EditarOperadorUseCase,
    ListarOperadoresDoAdministradorUseCase,
    BuscarOperadorUseCase,
    ExcluirOperadorUseCase,
    LoginOperadorUseCase,
  ],
  exports: [OPERADOR_REPOSITORY],
})
export class OperadoresModule {}

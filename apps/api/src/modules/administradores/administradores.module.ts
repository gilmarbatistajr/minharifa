import { Module } from '@nestjs/common';
import { SorteiosModule } from '../sorteios/sorteios.module';
import { ADMINISTRADOR_REPOSITORY } from './domain/repositories/administrador.repository';
import { PrismaAdministradorRepository } from './infrastructure/prisma-administrador.repository';
import { CadastrarAdministradorUseCase } from './application/use-cases/cadastrar-administrador.use-case';
import { ConfirmarEmailAdministradorUseCase } from './application/use-cases/confirmar-email-administrador.use-case';
import { LoginAdministradorUseCase } from './application/use-cases/login-administrador.use-case';
import { SolicitarRecuperacaoSenhaAdministradorUseCase } from './application/use-cases/solicitar-recuperacao-senha-administrador.use-case';
import { RedefinirSenhaAdministradorUseCase } from './application/use-cases/redefinir-senha-administrador.use-case';
import { VisualizarContaAdministradorUseCase } from './application/use-cases/visualizar-conta-administrador.use-case';
import { AtualizarNomeAdministradorUseCase } from './application/use-cases/atualizar-nome-administrador.use-case';
import { AlterarSenhaAdministradorUseCase } from './application/use-cases/alterar-senha-administrador.use-case';
import { SolicitarTrocaEmailAdministradorUseCase } from './application/use-cases/solicitar-troca-email-administrador.use-case';
import { ConfirmarNovoEmailAdministradorUseCase } from './application/use-cases/confirmar-novo-email-administrador.use-case';
import { ObterVisaoGeralDashboardUseCase } from './application/use-cases/obter-visao-geral-dashboard.use-case';
import { AdministradoresController } from './presentation/administradores.controller';

@Module({
  imports: [SorteiosModule],
  controllers: [AdministradoresController],
  providers: [
    { provide: ADMINISTRADOR_REPOSITORY, useClass: PrismaAdministradorRepository },
    CadastrarAdministradorUseCase,
    ConfirmarEmailAdministradorUseCase,
    LoginAdministradorUseCase,
    SolicitarRecuperacaoSenhaAdministradorUseCase,
    RedefinirSenhaAdministradorUseCase,
    VisualizarContaAdministradorUseCase,
    AtualizarNomeAdministradorUseCase,
    AlterarSenhaAdministradorUseCase,
    SolicitarTrocaEmailAdministradorUseCase,
    ConfirmarNovoEmailAdministradorUseCase,
    ObterVisaoGeralDashboardUseCase,
  ],
})
export class AdministradoresModule {}

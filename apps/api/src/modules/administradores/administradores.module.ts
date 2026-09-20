import { Module } from '@nestjs/common';
import { CampanhasModule } from '../campanhas/campanhas.module';
import { CompradoresModule } from '../compradores/compradores.module';
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
import { RankingCotasCompradasAdministradorUseCase } from './application/use-cases/ranking-cotas-compradas-administrador.use-case';
import { RankingVencedoresAdministradorUseCase } from './application/use-cases/ranking-vencedores-administrador.use-case';
import { CadastrarAdministradorMembroUseCase } from './application/use-cases/cadastrar-administrador-membro.use-case';
import { EditarAdministradorMembroUseCase } from './application/use-cases/editar-administrador-membro.use-case';
import { ListarAdministradoresMembrosUseCase } from './application/use-cases/listar-administradores-membros.use-case';
import { BuscarAdministradorMembroUseCase } from './application/use-cases/buscar-administrador-membro.use-case';
import { ExcluirAdministradorMembroUseCase } from './application/use-cases/excluir-administrador-membro.use-case';
import { AdministradoresController } from './presentation/administradores.controller';
import { AdministradoresMembrosController } from './presentation/administradores-membros.controller';

@Module({
  imports: [CampanhasModule, CompradoresModule],
  controllers: [AdministradoresController, AdministradoresMembrosController],
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
    RankingCotasCompradasAdministradorUseCase,
    RankingVencedoresAdministradorUseCase,
    CadastrarAdministradorMembroUseCase,
    EditarAdministradorMembroUseCase,
    ListarAdministradoresMembrosUseCase,
    BuscarAdministradorMembroUseCase,
    ExcluirAdministradorMembroUseCase,
  ],
})
export class AdministradoresModule {}

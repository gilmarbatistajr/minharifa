import { Module } from '@nestjs/common';
import { SorteiosModule } from '../sorteios/sorteios.module';
import { GRUPO_REPOSITORY } from './domain/repositories/grupo.repository';
import { AGENTE_CHATBOT_REPOSITORY } from './domain/repositories/agente-chatbot.repository';
import { LINK_CONVITE_REPOSITORY } from './domain/repositories/link-convite.repository';
import { PrismaGrupoRepository } from './infrastructure/prisma-grupo.repository';
import { PrismaAgenteChatbotRepository } from './infrastructure/prisma-agente-chatbot.repository';
import { PrismaLinkConviteRepository } from './infrastructure/prisma-link-convite.repository';
import { CadastrarGrupoUseCase } from './application/use-cases/cadastrar-grupo.use-case';
import { ListarGruposDoAdministradorUseCase } from './application/use-cases/listar-grupos-administrador.use-case';
import { BuscarGrupoUseCase } from './application/use-cases/buscar-grupo.use-case';
import { CriarAgenteChatbotUseCase } from './application/use-cases/criar-agente-chatbot.use-case';
import { ConfigurarAvisosAgenteChatbotUseCase } from './application/use-cases/configurar-avisos-agente-chatbot.use-case';
import { DesativarAgenteChatbotUseCase } from './application/use-cases/desativar-agente-chatbot.use-case';
import { ListarCompradoresDoGrupoUseCase } from './application/use-cases/listar-compradores-grupo.use-case';
import { ContarSorteiosDoGrupoUseCase } from './application/use-cases/contar-sorteios-grupo.use-case';
import { GerarLinkConviteUseCase } from './application/use-cases/gerar-link-convite.use-case';
import { ValidarCodigoConviteUseCase } from './application/use-cases/validar-codigo-convite.use-case';
import { RevogarLinkConviteUseCase } from './application/use-cases/revogar-link-convite.use-case';
import { ListarSorteiosVisiveisParaCompradorUseCase } from './application/use-cases/listar-sorteios-visiveis-comprador.use-case';
import { GruposController } from './presentation/grupos.controller';

@Module({
  imports: [SorteiosModule],
  controllers: [GruposController],
  providers: [
    { provide: GRUPO_REPOSITORY, useClass: PrismaGrupoRepository },
    { provide: AGENTE_CHATBOT_REPOSITORY, useClass: PrismaAgenteChatbotRepository },
    { provide: LINK_CONVITE_REPOSITORY, useClass: PrismaLinkConviteRepository },
    CadastrarGrupoUseCase,
    ListarGruposDoAdministradorUseCase,
    BuscarGrupoUseCase,
    CriarAgenteChatbotUseCase,
    ConfigurarAvisosAgenteChatbotUseCase,
    DesativarAgenteChatbotUseCase,
    ListarCompradoresDoGrupoUseCase,
    ContarSorteiosDoGrupoUseCase,
    GerarLinkConviteUseCase,
    ValidarCodigoConviteUseCase,
    RevogarLinkConviteUseCase,
    ListarSorteiosVisiveisParaCompradorUseCase,
  ],
  exports: [GRUPO_REPOSITORY, LINK_CONVITE_REPOSITORY, ValidarCodigoConviteUseCase],
})
export class GruposModule {}

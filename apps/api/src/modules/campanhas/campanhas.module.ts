import { Module, forwardRef } from '@nestjs/common';
import { PremiosModule } from '../premios/premios.module';
import { COTA_REPOSITORY } from './domain/repositories/cota.repository';
import { CAMPANHA_REPOSITORY } from './domain/repositories/campanha.repository';
import { PrismaCotaRepository } from './infrastructure/prisma-cota.repository';
import { PrismaCampanhaRepository } from './infrastructure/prisma-campanha.repository';
import { CriarCampanhaUseCase } from './application/use-cases/criar-campanha.use-case';
import { MarcarCampanhaComoRevisadaUseCase } from './application/use-cases/marcar-campanha-como-revisada.use-case';
import { ListarCampanhasDoAdministradorUseCase } from './application/use-cases/listar-campanhas-administrador.use-case';
import { BuscarCampanhaUseCase } from './application/use-cases/buscar-campanha.use-case';
import { FinalizarCampanhaUseCase } from './application/use-cases/finalizar-campanha.use-case';
import { ListarCampanhasVisiveisParaCompradorUseCase } from './application/use-cases/listar-campanhas-visiveis-comprador.use-case';
import { ListarCotasDaCampanhaUseCase } from './application/use-cases/listar-cotas-campanha.use-case';
import { ReservarCotaUseCase } from './application/use-cases/reservar-cota.use-case';
import { ReservarLoteCotasUseCase } from './application/use-cases/reservar-lote-cotas.use-case';
import { CampanhasController } from './presentation/campanhas.controller';

@Module({
  // forwardRef: PremiosModule também depende deste módulo (EditarPremioUseCase
  // valida campanhas vinculadas ao prêmio), e este depende de PremiosModule
  // (CriarCampanhaUseCase valida os prêmios selecionados) — dependência
  // circular legítima entre os dois agregados.
  imports: [forwardRef(() => PremiosModule)],
  controllers: [CampanhasController],
  providers: [
    { provide: COTA_REPOSITORY, useClass: PrismaCotaRepository },
    { provide: CAMPANHA_REPOSITORY, useClass: PrismaCampanhaRepository },
    CriarCampanhaUseCase,
    MarcarCampanhaComoRevisadaUseCase,
    ListarCampanhasDoAdministradorUseCase,
    BuscarCampanhaUseCase,
    FinalizarCampanhaUseCase,
    ListarCampanhasVisiveisParaCompradorUseCase,
    ListarCotasDaCampanhaUseCase,
    ReservarCotaUseCase,
    ReservarLoteCotasUseCase,
  ],
  exports: [COTA_REPOSITORY, CAMPANHA_REPOSITORY],
})
export class CampanhasModule {}

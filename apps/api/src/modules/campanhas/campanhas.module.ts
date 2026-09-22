import { Module, forwardRef } from '@nestjs/common';
import { PremiosModule } from '../premios/premios.module';
import { OperadoresModule } from '../operadores/operadores.module';
import { CompradoresModule } from '../compradores/compradores.module';
import { COTA_REPOSITORY } from './domain/repositories/cota.repository';
import { CAMPANHA_REPOSITORY } from './domain/repositories/campanha.repository';
import { PrismaCotaRepository } from './infrastructure/prisma-cota.repository';
import { PrismaCampanhaRepository } from './infrastructure/prisma-campanha.repository';
import { CriarCampanhaUseCase } from './application/use-cases/criar-campanha.use-case';
import { EditarCampanhaUseCase } from './application/use-cases/editar-campanha.use-case';
import { MarcarCampanhaComoRevisadaUseCase } from './application/use-cases/marcar-campanha-como-revisada.use-case';
import { ListarCampanhasDoAdministradorUseCase } from './application/use-cases/listar-campanhas-administrador.use-case';
import { BuscarCampanhaUseCase } from './application/use-cases/buscar-campanha.use-case';
import { FinalizarCampanhaUseCase } from './application/use-cases/finalizar-campanha.use-case';
import { RemoverCampanhaUseCase } from './application/use-cases/remover-campanha.use-case';
import { RestaurarCampanhaUseCase } from './application/use-cases/restaurar-campanha.use-case';
import { ListarCampanhasVisiveisParaCompradorUseCase } from './application/use-cases/listar-campanhas-visiveis-comprador.use-case';
import { ListarCotasDaCampanhaUseCase } from './application/use-cases/listar-cotas-campanha.use-case';
import { ReservarCotaUseCase } from './application/use-cases/reservar-cota.use-case';
import { ReservarLoteCotasUseCase } from './application/use-cases/reservar-lote-cotas.use-case';
import { AtualizarFotoCampanhaUseCase } from './application/use-cases/atualizar-foto-campanha.use-case';
import { ListarCotasParaAdministradorUseCase } from './application/use-cases/listar-cotas-administrador.use-case';
import { ConfirmarPagamentoManualUseCase } from './application/use-cases/confirmar-pagamento-manual.use-case';
import { LiberarCotasReservadasUseCase } from './application/use-cases/liberar-cotas-reservadas.use-case';
import { CancelarMinhaReservaUseCase } from './application/use-cases/cancelar-minha-reserva.use-case';
import { CampanhasController } from './presentation/campanhas.controller';

@Module({
  // forwardRef: PremiosModule também depende deste módulo (EditarPremioUseCase
  // valida campanhas vinculadas ao prêmio), e este depende de PremiosModule
  // (CriarCampanhaUseCase valida os prêmios selecionados) — dependência
  // circular legítima entre os dois agregados. OperadoresModule também fecha
  // um ciclo (Operadores -> Grupos -> Campanhas): FinalizarCampanhaUseCase
  // precisa resolver o administrador dono a partir do operador que finaliza.
  // CompradoresModule não depende de nada aqui, então entra sem forwardRef.
  imports: [forwardRef(() => PremiosModule), forwardRef(() => OperadoresModule), CompradoresModule],
  controllers: [CampanhasController],
  providers: [
    { provide: COTA_REPOSITORY, useClass: PrismaCotaRepository },
    { provide: CAMPANHA_REPOSITORY, useClass: PrismaCampanhaRepository },
    CriarCampanhaUseCase,
    EditarCampanhaUseCase,
    MarcarCampanhaComoRevisadaUseCase,
    ListarCampanhasDoAdministradorUseCase,
    BuscarCampanhaUseCase,
    FinalizarCampanhaUseCase,
    RemoverCampanhaUseCase,
    RestaurarCampanhaUseCase,
    ListarCampanhasVisiveisParaCompradorUseCase,
    ListarCotasDaCampanhaUseCase,
    ReservarCotaUseCase,
    ReservarLoteCotasUseCase,
    AtualizarFotoCampanhaUseCase,
    ListarCotasParaAdministradorUseCase,
    ConfirmarPagamentoManualUseCase,
    LiberarCotasReservadasUseCase,
    CancelarMinhaReservaUseCase,
  ],
  exports: [COTA_REPOSITORY, CAMPANHA_REPOSITORY],
})
export class CampanhasModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './shared/prisma/prisma.module';
import { SharedServicesModule } from './shared/services/shared-services.module';
import { AuthModule } from './shared/auth/auth.module';
import { SorteiosModule } from './modules/sorteios/sorteios.module';
import { AdministradoresModule } from './modules/administradores/administradores.module';
import { GruposModule } from './modules/grupos/grupos.module';
import { CompradoresModule } from './modules/compradores/compradores.module';
import { PremiosModule } from './modules/premios/premios.module';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SharedServicesModule,
    AuthModule,
    SorteiosModule,
    AdministradoresModule,
    GruposModule,
    CompradoresModule,
    PremiosModule,
    PagamentosModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { COMPRADOR_REPOSITORY } from './domain/repositories/comprador.repository';
import { PrismaCompradorRepository } from './infrastructure/prisma-comprador.repository';
import { CadastrarCompradorUseCase } from './application/use-cases/cadastrar-comprador.use-case';
import { LoginCompradorUseCase } from './application/use-cases/login-comprador.use-case';
import { SolicitarRecuperacaoSenhaCompradorUseCase } from './application/use-cases/solicitar-recuperacao-senha-comprador.use-case';
import { RedefinirSenhaCompradorUseCase } from './application/use-cases/redefinir-senha-comprador.use-case';
import { BuscarCompradorPorCpfUseCase } from './application/use-cases/buscar-comprador-por-cpf.use-case';
import { CompradoresController } from './presentation/compradores.controller';

@Module({
  controllers: [CompradoresController],
  providers: [
    { provide: COMPRADOR_REPOSITORY, useClass: PrismaCompradorRepository },
    CadastrarCompradorUseCase,
    LoginCompradorUseCase,
    SolicitarRecuperacaoSenhaCompradorUseCase,
    RedefinirSenhaCompradorUseCase,
    BuscarCompradorPorCpfUseCase,
  ],
  exports: [COMPRADOR_REPOSITORY],
})
export class CompradoresModule {}

import { Injectable } from '@nestjs/common';
import { EscolhaPosCancelamento as EscolhaPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  EscolhaPosCancelamento,
  StatusEscolhaPosCancelamento,
} from '../domain/entities/escolha-pos-cancelamento.entity';
import { EscolhaPosCancelamentoRepository } from '../domain/repositories/escolha-pos-cancelamento.repository';

function paraDominio(registro: EscolhaPrisma): EscolhaPosCancelamento {
  return new EscolhaPosCancelamento(
    registro.id,
    registro.sorteioId,
    registro.compradorId,
    registro.quantidadeCotas,
    registro.valorTotal.toNumber(),
    registro.status as StatusEscolhaPosCancelamento,
    registro.prazoExpiraEm,
    registro.decididoEm,
    registro.criadoEm,
  );
}

@Injectable()
export class PrismaEscolhaPosCancelamentoRepository implements EscolhaPosCancelamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<EscolhaPosCancelamento | null> {
    const registro = await this.prisma.escolhaPosCancelamento.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async listarPendentesExpiradas(agora: Date): Promise<EscolhaPosCancelamento[]> {
    const registros = await this.prisma.escolhaPosCancelamento.findMany({
      where: { status: 'PENDENTE', prazoExpiraEm: { lt: agora } },
    });
    return registros.map(paraDominio);
  }

  async criar(escolha: EscolhaPosCancelamento): Promise<void> {
    await this.prisma.escolhaPosCancelamento.create({
      data: {
        id: escolha.id,
        sorteioId: escolha.sorteioId,
        compradorId: escolha.compradorId,
        quantidadeCotas: escolha.quantidadeCotas,
        valorTotal: escolha.valorTotal,
        status: escolha.status,
        prazoExpiraEm: escolha.prazoExpiraEm,
        decididoEm: escolha.decididoEm,
        criadoEm: escolha.criadoEm,
      },
    });
  }

  async salvar(escolha: EscolhaPosCancelamento): Promise<void> {
    await this.prisma.escolhaPosCancelamento.update({
      where: { id: escolha.id },
      data: { status: escolha.status, decididoEm: escolha.decididoEm },
    });
  }
}

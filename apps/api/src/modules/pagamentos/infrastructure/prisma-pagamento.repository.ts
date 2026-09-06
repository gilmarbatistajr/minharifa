import { Injectable } from '@nestjs/common';
import { Pagamento as PagamentoPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MetodoPagamento, Pagamento, StatusPagamento } from '../domain/entities/pagamento.entity';
import { PagamentoRepository } from '../domain/repositories/pagamento.repository';

function paraDominio(registro: PagamentoPrisma): Pagamento {
  return new Pagamento(
    registro.id,
    registro.cotaId,
    registro.compradorId,
    registro.valor.toNumber(),
    registro.valorCashbackAplicado.toNumber(),
    registro.metodo as MetodoPagamento,
    registro.status as StatusPagamento,
    registro.idTransacaoGateway,
    registro.criadoEm,
  );
}

@Injectable()
export class PrismaPagamentoRepository implements PagamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Pagamento | null> {
    const registro = await this.prisma.pagamento.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorCotaId(cotaId: string): Promise<Pagamento | null> {
    const registro = await this.prisma.pagamento.findUnique({ where: { cotaId } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTransacaoGateway(idTransacaoGateway: string): Promise<Pagamento | null> {
    const registro = await this.prisma.pagamento.findFirst({ where: { idTransacaoGateway } });
    return registro ? paraDominio(registro) : null;
  }

  async criar(pagamento: Pagamento): Promise<void> {
    await this.prisma.pagamento.create({
      data: {
        id: pagamento.id,
        cotaId: pagamento.cotaId,
        compradorId: pagamento.compradorId,
        valor: pagamento.valor,
        valorCashbackAplicado: pagamento.valorCashbackAplicado,
        metodo: pagamento.metodo,
        status: pagamento.status,
        idTransacaoGateway: pagamento.idTransacaoGateway,
        criadoEm: pagamento.criadoEm,
      },
    });
  }

  async salvar(pagamento: Pagamento): Promise<void> {
    await this.prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        valorCashbackAplicado: pagamento.valorCashbackAplicado,
        metodo: pagamento.metodo,
        status: pagamento.status,
        idTransacaoGateway: pagamento.idTransacaoGateway,
      },
    });
  }
}

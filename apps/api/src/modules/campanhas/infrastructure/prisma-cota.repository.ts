import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Cota, StatusCota } from '../domain/entities/cota.entity';
import { CotaRepository, ContagemPorComprador } from '../domain/repositories/cota.repository';

@Injectable()
export class PrismaCotaRepository implements CotaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Cota | null> {
    const registro = await this.prisma.cota.findUnique({ where: { id } });

    if (!registro) {
      return null;
    }

    return new Cota(
      registro.id,
      registro.campanhaId,
      registro.numero,
      registro.status as StatusCota,
      registro.compradorId,
      registro.reservadaEm,
      registro.reservaExpiraEm,
    );
  }

  async buscarPorCampanhaENumero(campanhaId: string, numero: number): Promise<Cota | null> {
    const registro = await this.prisma.cota.findUnique({
      where: { campanhaId_numero: { campanhaId, numero } },
    });

    if (!registro) {
      return null;
    }

    return new Cota(
      registro.id,
      registro.campanhaId,
      registro.numero,
      registro.status as StatusCota,
      registro.compradorId,
      registro.reservadaEm,
      registro.reservaExpiraEm,
    );
  }

  async listarPorCampanha(campanhaId: string): Promise<Cota[]> {
    const registros = await this.prisma.cota.findMany({ where: { campanhaId } });

    return registros.map(
      (registro) =>
        new Cota(
          registro.id,
          registro.campanhaId,
          registro.numero,
          registro.status as StatusCota,
          registro.compradorId,
          registro.reservadaEm,
          registro.reservaExpiraEm,
        ),
    );
  }

  async contarPagasPorCampanha(campanhaId: string): Promise<number> {
    return this.prisma.cota.count({ where: { campanhaId, status: 'PAGA' } });
  }

  async contarPagasAgrupadoPorComprador(grupoId: string): Promise<ContagemPorComprador[]> {
    const resultado = await this.prisma.cota.groupBy({
      by: ['compradorId'],
      where: { status: 'PAGA', compradorId: { not: null }, campanha: { grupoId } },
      _count: { _all: true },
    });

    return resultado.map((item) => ({
      compradorId: item.compradorId as string,
      quantidade: item._count._all,
    }));
  }

  async contarPagasAgrupadoPorCompradorDoAdministrador(
    administradorId: string,
  ): Promise<ContagemPorComprador[]> {
    const resultado = await this.prisma.cota.groupBy({
      by: ['compradorId'],
      where: {
        status: 'PAGA',
        compradorId: { not: null },
        campanha: { administradorId },
      },
      _count: { _all: true },
    });

    return resultado.map((item) => ({
      compradorId: item.compradorId as string,
      quantidade: item._count._all,
    }));
  }

  async criarEmLote(cotas: Cota[]): Promise<void> {
    await this.prisma.cota.createMany({
      data: cotas.map((cota) => ({
        id: cota.id,
        campanhaId: cota.campanhaId,
        numero: cota.numero,
        status: cota.status,
        compradorId: cota.compradorId,
        reservadaEm: cota.reservadaEm,
        reservaExpiraEm: cota.reservaExpiraEm,
      })),
    });
  }

  async salvar(cota: Cota): Promise<void> {
    // Em produção, isto deve rodar dentro de uma transação com verificação
    // otimista (ex: where incluindo o status anterior) para garantir que
    // duas requisições concorrentes não sobrescrevam uma à outra — ver
    // cenário "concorrência" do reserva-de-cota.feature.
    await this.prisma.cota.update({
      where: { id: cota.id },
      data: {
        status: cota.status,
        compradorId: cota.compradorId,
        reservadaEm: cota.reservadaEm,
        reservaExpiraEm: cota.reservaExpiraEm,
      },
    });
  }
}

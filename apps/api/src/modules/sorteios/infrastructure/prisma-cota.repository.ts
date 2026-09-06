import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Cota, StatusCota } from '../domain/entities/cota.entity';
import { CotaRepository } from '../domain/repositories/cota.repository';

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
      registro.sorteioId,
      registro.numero,
      registro.status as StatusCota,
      registro.compradorId,
      registro.reservadaEm,
      registro.reservaExpiraEm,
    );
  }

  async buscarPorSorteioENumero(sorteioId: string, numero: number): Promise<Cota | null> {
    const registro = await this.prisma.cota.findUnique({
      where: { sorteioId_numero: { sorteioId, numero } },
    });

    if (!registro) {
      return null;
    }

    return new Cota(
      registro.id,
      registro.sorteioId,
      registro.numero,
      registro.status as StatusCota,
      registro.compradorId,
      registro.reservadaEm,
      registro.reservaExpiraEm,
    );
  }

  async listarPorSorteio(sorteioId: string): Promise<Cota[]> {
    const registros = await this.prisma.cota.findMany({ where: { sorteioId } });

    return registros.map(
      (registro) =>
        new Cota(
          registro.id,
          registro.sorteioId,
          registro.numero,
          registro.status as StatusCota,
          registro.compradorId,
          registro.reservadaEm,
          registro.reservaExpiraEm,
        ),
    );
  }

  async contarPagasPorSorteio(sorteioId: string): Promise<number> {
    return this.prisma.cota.count({ where: { sorteioId, status: 'PAGA' } });
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

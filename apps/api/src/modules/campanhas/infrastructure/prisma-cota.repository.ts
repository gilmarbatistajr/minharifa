import { Injectable } from '@nestjs/common';
import { Cota as CotaPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Cota, StatusCota } from '../domain/entities/cota.entity';
import { CotaRepository, ContagemPorComprador } from '../domain/repositories/cota.repository';

function paraDominio(registro: CotaPrisma): Cota {
  return new Cota(
    registro.id,
    registro.campanhaId,
    registro.numero,
    registro.status as StatusCota,
    registro.compradorId,
    registro.reservadaEm,
    registro.reservaExpiraEm,
    registro.tokenReservaConvidado,
    registro.convidadoNome,
    registro.convidadoEmail,
    registro.convidadoTelefone,
  );
}

@Injectable()
export class PrismaCotaRepository implements CotaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Cota | null> {
    const registro = await this.prisma.cota.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorCampanhaENumero(campanhaId: string, numero: number): Promise<Cota | null> {
    const registro = await this.prisma.cota.findUnique({
      where: { campanhaId_numero: { campanhaId, numero } },
    });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorCampanha(campanhaId: string): Promise<Cota[]> {
    const registros = await this.prisma.cota.findMany({ where: { campanhaId } });
    return registros.map(paraDominio);
  }

  async listarReservadasPorComprador(campanhaId: string, compradorId: string): Promise<Cota[]> {
    const registros = await this.prisma.cota.findMany({
      where: { campanhaId, compradorId, status: 'RESERVADA' },
    });
    return registros.map(paraDominio);
  }

  async listarReservadasPorTokenConvidado(campanhaId: string, token: string): Promise<Cota[]> {
    const registros = await this.prisma.cota.findMany({
      where: { campanhaId, tokenReservaConvidado: token, status: 'RESERVADA' },
    });
    return registros.map(paraDominio);
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
        tokenReservaConvidado: cota.tokenReservaConvidado,
        convidadoNome: cota.convidadoNome,
        convidadoEmail: cota.convidadoEmail,
        convidadoTelefone: cota.convidadoTelefone,
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
        tokenReservaConvidado: cota.tokenReservaConvidado,
        convidadoNome: cota.convidadoNome,
        convidadoEmail: cota.convidadoEmail,
        convidadoTelefone: cota.convidadoTelefone,
      },
    });
  }
}

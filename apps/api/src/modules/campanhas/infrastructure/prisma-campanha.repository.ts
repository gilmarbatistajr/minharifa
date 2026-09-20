import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  Campanha,
  StatusCampanha,
  StatusVendasCampanha,
  FormaVendaCotas,
} from '../domain/entities/campanha.entity';
import { CampanhaRepository } from '../domain/repositories/campanha.repository';

const INCLUDE_PREMIOS = { premios: { select: { id: true } } } as const;

type RegistroCampanha = {
  id: string;
  administradorId: string;
  grupoId: string | null;
  nome: string;
  descricao: string;
  premios: { id: string }[];
  dataAberturaVendas: Date | null;
  dataEncerramentoVendas: Date | null;
  dataRealizacao: Date | null;
  quantidadeCotas: number;
  valorCota: { toNumber(): number };
  formaVenda: string;
  status: string;
  statusVendas: string;
  cotaVencedoraNumero: number | null;
  vencedorOptouPorDinheiro: boolean | null;
  removidaEm: Date | null;
};

function paraDominio(registro: RegistroCampanha): Campanha {
  return new Campanha(
    registro.id,
    registro.administradorId,
    registro.grupoId,
    registro.nome,
    registro.descricao,
    registro.premios.map((premio) => premio.id),
    registro.dataAberturaVendas,
    registro.dataEncerramentoVendas,
    registro.dataRealizacao,
    registro.quantidadeCotas,
    registro.valorCota.toNumber(),
    registro.formaVenda as FormaVendaCotas,
    registro.status as StatusCampanha,
    registro.statusVendas as StatusVendasCampanha,
    registro.cotaVencedoraNumero,
    registro.vencedorOptouPorDinheiro,
    registro.removidaEm,
  );
}

@Injectable()
export class PrismaCampanhaRepository implements CampanhaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Campanha | null> {
    const registro = await this.prisma.campanha.findUnique({
      where: { id },
      include: INCLUDE_PREMIOS,
    });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorPremioId(premioId: string): Promise<Campanha[]> {
    const registros = await this.prisma.campanha.findMany({
      where: { premios: { some: { id: premioId } } },
      include: INCLUDE_PREMIOS,
    });
    return registros.map(paraDominio);
  }

  async listarPorGrupo(grupoId: string): Promise<Campanha[]> {
    const registros = await this.prisma.campanha.findMany({
      where: { grupoId },
      include: INCLUDE_PREMIOS,
    });
    return registros.map(paraDominio);
  }

  async listarPorAdministrador(administradorId: string): Promise<Campanha[]> {
    const registros = await this.prisma.campanha.findMany({
      where: { administradorId },
      include: INCLUDE_PREMIOS,
    });
    return registros.map(paraDominio);
  }

  async criar(campanha: Campanha): Promise<void> {
    await this.prisma.campanha.create({
      data: {
        id: campanha.id,
        administradorId: campanha.administradorId,
        grupoId: campanha.grupoId,
        nome: campanha.nome,
        descricao: campanha.descricao,
        premios: { connect: campanha.premioIds.map((id) => ({ id })) },
        dataAberturaVendas: campanha.dataAberturaVendas,
        dataEncerramentoVendas: campanha.dataEncerramentoVendas,
        dataRealizacao: campanha.dataRealizacao,
        quantidadeCotas: campanha.quantidadeCotas,
        valorCota: campanha.valorCota,
        formaVenda: campanha.formaVenda,
        status: campanha.status,
        statusVendas: campanha.statusVendas,
      },
    });
  }

  async salvar(campanha: Campanha): Promise<void> {
    await this.prisma.campanha.update({
      where: { id: campanha.id },
      data: {
        grupoId: campanha.grupoId,
        dataAberturaVendas: campanha.dataAberturaVendas,
        dataEncerramentoVendas: campanha.dataEncerramentoVendas,
        dataRealizacao: campanha.dataRealizacao,
        valorCota: campanha.valorCota,
        status: campanha.status,
        statusVendas: campanha.statusVendas,
        cotaVencedoraNumero: campanha.cotaVencedoraNumero,
        vencedorOptouPorDinheiro: campanha.vencedorOptouPorDinheiro,
        removidaEm: campanha.removidaEm,
      },
    });
  }
}

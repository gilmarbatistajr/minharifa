import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Sorteio, StatusSorteio } from '../domain/entities/sorteio.entity';
import { SorteioRepository } from '../domain/repositories/sorteio.repository';

const INCLUDE_PREMIOS = { premios: { select: { id: true } } } as const;

type RegistroSorteio = {
  id: string;
  grupoId: string;
  nome: string;
  descricao: string;
  premios: { id: string }[];
  dataAberturaVendas: Date;
  dataEncerramentoVendas: Date;
  dataRealizacao: Date;
  quantidadeCotas: number;
  valorCota: { toNumber(): number };
  status: string;
  cotaVencedoraNumero: number | null;
  vencedorOptouPorDinheiro: boolean | null;
};

function paraDominio(registro: RegistroSorteio): Sorteio {
  return new Sorteio(
    registro.id,
    registro.grupoId,
    registro.nome,
    registro.descricao,
    registro.premios.map((premio) => premio.id),
    registro.dataAberturaVendas,
    registro.dataEncerramentoVendas,
    registro.dataRealizacao,
    registro.quantidadeCotas,
    registro.valorCota.toNumber(),
    registro.status as StatusSorteio,
    registro.cotaVencedoraNumero,
    registro.vencedorOptouPorDinheiro,
  );
}

@Injectable()
export class PrismaSorteioRepository implements SorteioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Sorteio | null> {
    const registro = await this.prisma.sorteio.findUnique({
      where: { id },
      include: INCLUDE_PREMIOS,
    });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorPremioId(premioId: string): Promise<Sorteio[]> {
    const registros = await this.prisma.sorteio.findMany({
      where: { premios: { some: { id: premioId } } },
      include: INCLUDE_PREMIOS,
    });
    return registros.map(paraDominio);
  }

  async listarPorGrupo(grupoId: string): Promise<Sorteio[]> {
    const registros = await this.prisma.sorteio.findMany({
      where: { grupoId },
      include: INCLUDE_PREMIOS,
    });
    return registros.map(paraDominio);
  }

  async listarPorAdministrador(administradorId: string): Promise<Sorteio[]> {
    const registros = await this.prisma.sorteio.findMany({
      where: { grupo: { administradorId } },
      include: INCLUDE_PREMIOS,
    });
    return registros.map(paraDominio);
  }

  async criar(sorteio: Sorteio): Promise<void> {
    await this.prisma.sorteio.create({
      data: {
        id: sorteio.id,
        grupoId: sorteio.grupoId,
        nome: sorteio.nome,
        descricao: sorteio.descricao,
        premios: { connect: sorteio.premioIds.map((id) => ({ id })) },
        dataAberturaVendas: sorteio.dataAberturaVendas,
        dataEncerramentoVendas: sorteio.dataEncerramentoVendas,
        dataRealizacao: sorteio.dataRealizacao,
        quantidadeCotas: sorteio.quantidadeCotas,
        valorCota: sorteio.valorCota,
        status: sorteio.status,
      },
    });
  }

  async salvar(sorteio: Sorteio): Promise<void> {
    await this.prisma.sorteio.update({
      where: { id: sorteio.id },
      data: {
        status: sorteio.status,
        cotaVencedoraNumero: sorteio.cotaVencedoraNumero,
        vencedorOptouPorDinheiro: sorteio.vencedorOptouPorDinheiro,
      },
    });
  }
}

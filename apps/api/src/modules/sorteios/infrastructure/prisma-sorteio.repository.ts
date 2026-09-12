import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Sorteio, StatusSorteio } from '../domain/entities/sorteio.entity';
import { SorteioRepository } from '../domain/repositories/sorteio.repository';

type RegistroSorteio = {
  id: string;
  grupoId: string;
  premioId: string;
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
    registro.premioId,
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
    const registro = await this.prisma.sorteio.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorPremioId(premioId: string): Promise<Sorteio | null> {
    const registro = await this.prisma.sorteio.findUnique({ where: { premioId } });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorGrupo(grupoId: string): Promise<Sorteio[]> {
    const registros = await this.prisma.sorteio.findMany({ where: { grupoId } });
    return registros.map(paraDominio);
  }

  async listarPorAdministrador(administradorId: string): Promise<Sorteio[]> {
    const registros = await this.prisma.sorteio.findMany({
      where: { grupo: { administradorId } },
    });
    return registros.map(paraDominio);
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

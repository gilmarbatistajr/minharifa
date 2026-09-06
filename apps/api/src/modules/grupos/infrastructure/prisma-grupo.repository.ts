import { Injectable } from '@nestjs/common';
import { Grupo as GrupoPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Grupo } from '../domain/entities/grupo.entity';
import { CompradorResumo, GrupoRepository } from '../domain/repositories/grupo.repository';

function paraDominio(registro: GrupoPrisma): Grupo {
  return new Grupo(
    registro.id,
    registro.administradorId,
    registro.nome,
    registro.identificadorWhatsapp,
    registro.criadoEm,
  );
}

@Injectable()
export class PrismaGrupoRepository implements GrupoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Grupo | null> {
    const registro = await this.prisma.grupo.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorIdentificadorWhatsapp(identificadorWhatsapp: string): Promise<Grupo | null> {
    const registro = await this.prisma.grupo.findUnique({ where: { identificadorWhatsapp } });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorAdministrador(administradorId: string): Promise<Grupo[]> {
    const registros = await this.prisma.grupo.findMany({ where: { administradorId } });
    return registros.map(paraDominio);
  }

  async listarCompradores(grupoId: string): Promise<CompradorResumo[]> {
    const registros = await this.prisma.comprador.findMany({
      where: { grupoId },
      select: { id: true, nome: true, telefone: true },
    });
    return registros;
  }

  async criar(grupo: Grupo): Promise<void> {
    await this.prisma.grupo.create({
      data: {
        id: grupo.id,
        administradorId: grupo.administradorId,
        nome: grupo.nome,
        identificadorWhatsapp: grupo.identificadorWhatsapp,
        criadoEm: grupo.criadoEm,
      },
    });
  }
}

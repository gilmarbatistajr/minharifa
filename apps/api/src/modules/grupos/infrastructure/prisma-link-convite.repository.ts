import { Injectable } from '@nestjs/common';
import { LinkConvite as LinkConvitePrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LinkConvite, StatusLinkConvite } from '../domain/entities/link-convite.entity';
import { LinkConviteRepository } from '../domain/repositories/link-convite.repository';

function paraDominio(registro: LinkConvitePrisma): LinkConvite {
  return new LinkConvite(
    registro.id,
    registro.grupoId,
    registro.codigo,
    registro.status as StatusLinkConvite,
    registro.criadoEm,
  );
}

@Injectable()
export class PrismaLinkConviteRepository implements LinkConviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<LinkConvite | null> {
    const registro = await this.prisma.linkConvite.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<LinkConvite | null> {
    const registro = await this.prisma.linkConvite.findUnique({ where: { codigo } });
    return registro ? paraDominio(registro) : null;
  }

  async criar(linkConvite: LinkConvite): Promise<void> {
    await this.prisma.linkConvite.create({
      data: {
        id: linkConvite.id,
        grupoId: linkConvite.grupoId,
        codigo: linkConvite.codigo,
        status: linkConvite.status,
        criadoEm: linkConvite.criadoEm,
      },
    });
  }

  async salvar(linkConvite: LinkConvite): Promise<void> {
    await this.prisma.linkConvite.update({
      where: { id: linkConvite.id },
      data: { status: linkConvite.status },
    });
  }
}

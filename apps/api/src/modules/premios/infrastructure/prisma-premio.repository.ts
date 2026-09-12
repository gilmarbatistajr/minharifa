import { Injectable } from '@nestjs/common';
import { Premio as PremioPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Premio } from '../domain/entities/premio.entity';
import { PremioRepository } from '../domain/repositories/premio.repository';

function paraDominio(registro: PremioPrisma): Premio {
  return new Premio(
    registro.id,
    registro.administradorId,
    registro.nome,
    registro.descricao,
    registro.fotoUrl,
    registro.valor.toNumber(),
    registro.valorOpcaoDinheiro ? registro.valorOpcaoDinheiro.toNumber() : null,
    registro.criadoEm,
  );
}

@Injectable()
export class PrismaPremioRepository implements PremioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Premio | null> {
    const registro = await this.prisma.premio.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorAdministrador(administradorId: string): Promise<Premio[]> {
    const registros = await this.prisma.premio.findMany({ where: { administradorId } });
    return registros.map(paraDominio);
  }

  async criar(premio: Premio): Promise<void> {
    await this.prisma.premio.create({
      data: {
        id: premio.id,
        administradorId: premio.administradorId,
        nome: premio.nome,
        descricao: premio.descricao,
        fotoUrl: premio.fotoUrl,
        valor: premio.valor,
        valorOpcaoDinheiro: premio.valorOpcaoDinheiro,
        criadoEm: premio.criadoEm,
      },
    });
  }

  async salvar(premio: Premio): Promise<void> {
    await this.prisma.premio.update({
      where: { id: premio.id },
      data: {
        nome: premio.nome,
        descricao: premio.descricao,
        fotoUrl: premio.fotoUrl,
        valor: premio.valor,
        valorOpcaoDinheiro: premio.valorOpcaoDinheiro,
      },
    });
  }
}

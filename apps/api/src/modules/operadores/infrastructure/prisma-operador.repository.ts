import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Operador, RecursoMenuOperador } from '../domain/entities/operador.entity';
import { OperadorRepository } from '../domain/repositories/operador.repository';
import { PermissaoOperador as PermissaoOperadorPrisma } from '@prisma/client';

const INCLUDE_RELACOES = {
  grupos: { select: { id: true } },
  permissoes: true,
} as const;

type RegistroOperador = {
  id: string;
  administradorId: string;
  nomeCompleto: string;
  endereco: string;
  cpf: string;
  rg: string;
  telefone: string;
  login: string;
  senhaHash: string;
  criadoEm: Date;
  grupos: { id: string }[];
  permissoes: PermissaoOperadorPrisma[];
};

function paraDominio(registro: RegistroOperador): Operador {
  return new Operador(
    registro.id,
    registro.administradorId,
    registro.nomeCompleto,
    registro.endereco,
    registro.cpf,
    registro.rg,
    registro.telefone,
    registro.login,
    registro.senhaHash,
    registro.grupos.map((grupo) => grupo.id),
    registro.criadoEm,
    registro.permissoes.map((permissao) => ({
      recurso: permissao.recurso as RecursoMenuOperador,
      podeCriar: permissao.podeCriar,
      podeEditar: permissao.podeEditar,
      podeRemover: permissao.podeRemover,
    })),
  );
}

@Injectable()
export class PrismaOperadorRepository implements OperadorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Operador | null> {
    const registro = await this.prisma.operador.findUnique({ where: { id }, include: INCLUDE_RELACOES });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorLogin(login: string): Promise<Operador | null> {
    const registro = await this.prisma.operador.findUnique({ where: { login }, include: INCLUDE_RELACOES });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorCpf(cpf: string): Promise<Operador | null> {
    const registro = await this.prisma.operador.findUnique({ where: { cpf }, include: INCLUDE_RELACOES });
    return registro ? paraDominio(registro) : null;
  }

  async listarPorAdministrador(administradorId: string): Promise<Operador[]> {
    const registros = await this.prisma.operador.findMany({
      where: { administradorId },
      include: INCLUDE_RELACOES,
    });
    return registros.map(paraDominio);
  }

  async criar(operador: Operador): Promise<void> {
    await this.prisma.operador.create({
      data: {
        id: operador.id,
        administradorId: operador.administradorId,
        nomeCompleto: operador.nomeCompleto,
        endereco: operador.endereco,
        cpf: operador.cpf,
        rg: operador.rg,
        telefone: operador.telefone,
        login: operador.login,
        senhaHash: operador.senhaHash,
        criadoEm: operador.criadoEm,
        grupos: { connect: operador.grupoIds.map((id) => ({ id })) },
        permissoes: {
          create: operador.permissoes.map((permissao) => ({
            recurso: permissao.recurso,
            podeCriar: permissao.podeCriar,
            podeEditar: permissao.podeEditar,
            podeRemover: permissao.podeRemover,
          })),
        },
      },
    });
  }

  async salvar(operador: Operador): Promise<void> {
    await this.prisma.permissaoOperador.deleteMany({ where: { operadorId: operador.id } });

    await this.prisma.operador.update({
      where: { id: operador.id },
      data: {
        nomeCompleto: operador.nomeCompleto,
        endereco: operador.endereco,
        rg: operador.rg,
        telefone: operador.telefone,
        login: operador.login,
        senhaHash: operador.senhaHash,
        grupos: { set: operador.grupoIds.map((id) => ({ id })) },
        permissoes: {
          create: operador.permissoes.map((permissao) => ({
            recurso: permissao.recurso,
            podeCriar: permissao.podeCriar,
            podeEditar: permissao.podeEditar,
            podeRemover: permissao.podeRemover,
          })),
        },
      },
    });
  }

  async remover(id: string): Promise<void> {
    await this.prisma.operador.delete({ where: { id } });
  }
}

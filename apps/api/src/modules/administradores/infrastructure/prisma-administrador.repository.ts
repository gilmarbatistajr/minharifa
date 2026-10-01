import { Injectable } from '@nestjs/common';
import { Administrador as AdministradorPrisma, PermissaoAdministrador as PermissaoPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Administrador, RecursoMenuAdmin } from '../domain/entities/administrador.entity';
import { AdministradorRepository } from '../domain/repositories/administrador.repository';

const INCLUDE_PERMISSOES = { permissoes: true } as const;

type RegistroAdministrador = AdministradorPrisma & { permissoes: PermissaoPrisma[] };

function paraDominio(registro: RegistroAdministrador): Administrador {
  return new Administrador(
    registro.id,
    registro.nome,
    registro.email,
    registro.senhaHash,
    registro.emailConfirmado,
    registro.criadoEm,
    registro.tokenConfirmacaoEmail,
    registro.tokenConfirmacaoEmailExpiraEm,
    registro.tokenRecuperacaoSenha,
    registro.tokenRecuperacaoSenhaExpiraEm,
    registro.novoEmailPendente,
    registro.tokenConfirmacaoNovoEmail,
    registro.tokenConfirmacaoNovoEmailExpiraEm,
    registro.telefone,
    registro.cpf,
    registro.rg,
    registro.administradorProprietarioId,
    registro.permissoes.map((permissao) => ({
      recurso: permissao.recurso as RecursoMenuAdmin,
      podeCriar: permissao.podeCriar,
      podeEditar: permissao.podeEditar,
      podeRemover: permissao.podeRemover,
    })),
  );
}

@Injectable()
export class PrismaAdministradorRepository implements AdministradorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({ where: { id }, include: INCLUDE_PERMISSOES });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { email },
      include: INCLUDE_PERMISSOES,
    });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorCpf(cpf: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({ where: { cpf }, include: INCLUDE_PERMISSOES });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenConfirmacaoEmail(token: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { tokenConfirmacaoEmail: token },
      include: INCLUDE_PERMISSOES,
    });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenRecuperacaoSenha(token: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { tokenRecuperacaoSenha: token },
      include: INCLUDE_PERMISSOES,
    });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenConfirmacaoNovoEmail(token: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { tokenConfirmacaoNovoEmail: token },
      include: INCLUDE_PERMISSOES,
    });
    return registro ? paraDominio(registro) : null;
  }

  async listarMembrosDaConta(contaId: string): Promise<Administrador[]> {
    const registros = await this.prisma.administrador.findMany({
      where: { administradorProprietarioId: contaId },
      include: INCLUDE_PERMISSOES,
    });
    return registros.map(paraDominio);
  }

  async criar(administrador: Administrador): Promise<void> {
    await this.prisma.administrador.create({
      data: {
        id: administrador.id,
        nome: administrador.nome,
        email: administrador.email,
        senhaHash: administrador.senhaHash,
        emailConfirmado: administrador.emailConfirmado,
        criadoEm: administrador.criadoEm,
        tokenConfirmacaoEmail: administrador.tokenConfirmacaoEmail,
        tokenConfirmacaoEmailExpiraEm: administrador.tokenConfirmacaoEmailExpiraEm,
        telefone: administrador.telefone,
        cpf: administrador.cpf,
        rg: administrador.rg,
        administradorProprietarioId: administrador.administradorProprietarioId,
        permissoes: {
          create: administrador.permissoes.map((permissao) => ({
            recurso: permissao.recurso,
            podeCriar: permissao.podeCriar,
            podeEditar: permissao.podeEditar,
            podeRemover: permissao.podeRemover,
          })),
        },
      },
    });
  }

  async salvar(administrador: Administrador): Promise<void> {
    await this.prisma.permissaoAdministrador.deleteMany({ where: { administradorId: administrador.id } });

    await this.prisma.administrador.update({
      where: { id: administrador.id },
      data: {
        nome: administrador.nome,
        email: administrador.email,
        senhaHash: administrador.senhaHash,
        emailConfirmado: administrador.emailConfirmado,
        tokenConfirmacaoEmail: administrador.tokenConfirmacaoEmail,
        tokenConfirmacaoEmailExpiraEm: administrador.tokenConfirmacaoEmailExpiraEm,
        tokenRecuperacaoSenha: administrador.tokenRecuperacaoSenha,
        tokenRecuperacaoSenhaExpiraEm: administrador.tokenRecuperacaoSenhaExpiraEm,
        novoEmailPendente: administrador.novoEmailPendente,
        tokenConfirmacaoNovoEmail: administrador.tokenConfirmacaoNovoEmail,
        tokenConfirmacaoNovoEmailExpiraEm: administrador.tokenConfirmacaoNovoEmailExpiraEm,
        telefone: administrador.telefone,
        rg: administrador.rg,
        permissoes: {
          create: administrador.permissoes.map((permissao) => ({
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
    await this.prisma.administrador.delete({ where: { id } });
  }
}

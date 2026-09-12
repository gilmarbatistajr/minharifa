import { Injectable } from '@nestjs/common';
import { Administrador as AdministradorPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Administrador } from '../domain/entities/administrador.entity';
import { AdministradorRepository } from '../domain/repositories/administrador.repository';

function paraDominio(registro: AdministradorPrisma): Administrador {
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
  );
}

@Injectable()
export class PrismaAdministradorRepository implements AdministradorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({ where: { email } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenConfirmacaoEmail(token: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { tokenConfirmacaoEmail: token },
    });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenRecuperacaoSenha(token: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { tokenRecuperacaoSenha: token },
    });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenConfirmacaoNovoEmail(token: string): Promise<Administrador | null> {
    const registro = await this.prisma.administrador.findUnique({
      where: { tokenConfirmacaoNovoEmail: token },
    });
    return registro ? paraDominio(registro) : null;
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
      },
    });
  }

  async salvar(administrador: Administrador): Promise<void> {
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
      },
    });
  }
}

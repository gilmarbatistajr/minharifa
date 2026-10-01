import { Injectable } from '@nestjs/common';
import { Comprador as CompradorPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Comprador } from '../domain/entities/comprador.entity';
import { CompradorRepository } from '../domain/repositories/comprador.repository';

function paraDominio(registro: CompradorPrisma): Comprador {
  return new Comprador(
    registro.id,
    registro.grupoId,
    registro.nome,
    registro.apelido,
    registro.dataNascimento,
    registro.telefone,
    registro.cpf,
    registro.endereco,
    registro.email,
    registro.senhaHash,
    registro.cashbackDisponivel.toNumber(),
    registro.aceitouTermoEm,
    registro.criadoEm,
    registro.googleId,
    registro.facebookId,
    registro.appleId,
    registro.tokenRecuperacaoSenha,
    registro.tokenRecuperacaoSenhaExpiraEm,
  );
}

@Injectable()
export class PrismaCompradorRepository implements CompradorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Comprador | null> {
    const registro = await this.prisma.comprador.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorCpf(cpf: string): Promise<Comprador | null> {
    const registro = await this.prisma.comprador.findUnique({ where: { cpf } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Comprador | null> {
    const registro = await this.prisma.comprador.findUnique({ where: { email } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorTokenRecuperacaoSenha(token: string): Promise<Comprador | null> {
    const registro = await this.prisma.comprador.findUnique({
      where: { tokenRecuperacaoSenha: token },
    });
    return registro ? paraDominio(registro) : null;
  }

  async criar(comprador: Comprador): Promise<void> {
    await this.prisma.comprador.create({
      data: {
        id: comprador.id,
        grupoId: comprador.grupoId,
        nome: comprador.nome,
        apelido: comprador.apelido,
        dataNascimento: comprador.dataNascimento,
        telefone: comprador.telefone,
        cpf: comprador.cpf,
        endereco: comprador.endereco,
        email: comprador.email,
        senhaHash: comprador.senhaHash,
        cashbackDisponivel: comprador.cashbackDisponivel,
        aceitouTermoEm: comprador.aceitouTermoEm,
        criadoEm: comprador.criadoEm,
      },
    });
  }

  async salvar(comprador: Comprador): Promise<void> {
    await this.prisma.comprador.update({
      where: { id: comprador.id },
      data: {
        nome: comprador.nome,
        apelido: comprador.apelido,
        telefone: comprador.telefone,
        endereco: comprador.endereco,
        email: comprador.email,
        senhaHash: comprador.senhaHash,
        cashbackDisponivel: comprador.cashbackDisponivel,
        googleId: comprador.googleId,
        facebookId: comprador.facebookId,
        appleId: comprador.appleId,
        tokenRecuperacaoSenha: comprador.tokenRecuperacaoSenha,
        tokenRecuperacaoSenhaExpiraEm: comprador.tokenRecuperacaoSenhaExpiraEm,
      },
    });
  }
}

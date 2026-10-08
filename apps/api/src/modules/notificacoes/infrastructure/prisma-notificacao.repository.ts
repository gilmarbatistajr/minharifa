import { Injectable } from '@nestjs/common';
import { Notificacao as NotificacaoPrisma, Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Notificacao, TipoNotificacao } from '../domain/entities/notificacao.entity';
import {
  EscopoOperador,
  FiltroNotificacoes,
  NotificacaoRepository,
} from '../domain/repositories/notificacao.repository';

function paraDominio(registro: NotificacaoPrisma): Notificacao {
  return new Notificacao(
    registro.id,
    registro.administradorId,
    registro.campanhaId,
    registro.grupoId,
    registro.tipo as TipoNotificacao,
    registro.mensagem,
    registro.lidaEm,
    registro.criadoEm,
  );
}

function paraWhere(filtro: FiltroNotificacoes): Prisma.NotificacaoWhereInput {
  return {
    administradorId: filtro.administradorId,
    ...(filtro.grupoIds ? { grupoId: { in: filtro.grupoIds } } : {}),
  };
}

@Injectable()
export class PrismaNotificacaoRepository implements NotificacaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(notificacao: Notificacao): Promise<void> {
    await this.prisma.notificacao.create({
      data: {
        id: notificacao.id,
        administradorId: notificacao.administradorId,
        campanhaId: notificacao.campanhaId,
        grupoId: notificacao.grupoId,
        tipo: notificacao.tipo,
        mensagem: notificacao.mensagem,
        lidaEm: notificacao.lidaEm,
        criadoEm: notificacao.criadoEm,
      },
    });
  }

  async buscarPorId(id: string): Promise<Notificacao | null> {
    const registro = await this.prisma.notificacao.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async salvar(notificacao: Notificacao): Promise<void> {
    await this.prisma.notificacao.update({
      where: { id: notificacao.id },
      data: { lidaEm: notificacao.lidaEm },
    });
  }

  async listar(filtro: FiltroNotificacoes, limite: number): Promise<Notificacao[]> {
    const registros = await this.prisma.notificacao.findMany({
      where: paraWhere(filtro),
      orderBy: { criadoEm: 'desc' },
      take: limite,
    });
    return registros.map(paraDominio);
  }

  contarNaoLidas(filtro: FiltroNotificacoes): Promise<number> {
    return this.prisma.notificacao.count({ where: { ...paraWhere(filtro), lidaEm: null } });
  }

  async marcarTodasComoLidas(filtro: FiltroNotificacoes, agora: Date): Promise<void> {
    await this.prisma.notificacao.updateMany({
      where: { ...paraWhere(filtro), lidaEm: null },
      data: { lidaEm: agora },
    });
  }

  async existePorCampanhaETipo(campanhaId: string, tipo: TipoNotificacao): Promise<boolean> {
    const total = await this.prisma.notificacao.count({ where: { campanhaId, tipo } });
    return total > 0;
  }

  // Leitura direta da tabela de operadores (em vez de importar o módulo
  // `operadores`) para evitar dependência circular: campanhas/pagamentos
  // importam este módulo, e operadores depende de grupos → campanhas.
  async buscarEscopoDoOperador(operadorId: string): Promise<EscopoOperador | null> {
    const operador = await this.prisma.operador.findUnique({
      where: { id: operadorId },
      select: { administradorId: true, grupos: { select: { id: true } } },
    });
    if (!operador) {
      return null;
    }

    return { administradorId: operador.administradorId, grupoIds: operador.grupos.map((grupo) => grupo.id) };
  }
}

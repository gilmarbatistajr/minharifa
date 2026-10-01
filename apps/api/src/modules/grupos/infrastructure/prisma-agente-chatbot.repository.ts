import { Injectable } from '@nestjs/common';
import { AgenteChatbot as AgenteChatbotPrisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AgenteChatbot } from '../domain/entities/agente-chatbot.entity';
import { AgenteChatbotRepository } from '../domain/repositories/agente-chatbot.repository';

function paraDominio(registro: AgenteChatbotPrisma): AgenteChatbot {
  return new AgenteChatbot(
    registro.id,
    registro.grupoId,
    registro.ativo,
    registro.avisa50PorCentoVendido,
    registro.avisaNovaCampanha,
    registro.avisaResultado,
    registro.mensagem50PorCentoVendido,
    registro.mensagemNovaCampanha,
    registro.mensagemResultado,
    registro.avisa80PorCentoVendido,
    registro.avisa90PorCentoVendido,
    registro.mensagem80PorCentoVendido,
    registro.mensagem90PorCentoVendido,
  );
}

@Injectable()
export class PrismaAgenteChatbotRepository implements AgenteChatbotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorGrupoId(grupoId: string): Promise<AgenteChatbot | null> {
    const registro = await this.prisma.agenteChatbot.findUnique({ where: { grupoId } });
    return registro ? paraDominio(registro) : null;
  }

  async criar(agente: AgenteChatbot): Promise<void> {
    await this.prisma.agenteChatbot.create({
      data: {
        id: agente.id,
        grupoId: agente.grupoId,
        ativo: agente.ativo,
        avisa50PorCentoVendido: agente.avisa50PorCentoVendido,
        avisa80PorCentoVendido: agente.avisa80PorCentoVendido,
        avisa90PorCentoVendido: agente.avisa90PorCentoVendido,
        avisaNovaCampanha: agente.avisaNovaCampanha,
        avisaResultado: agente.avisaResultado,
        mensagem50PorCentoVendido: agente.mensagem50PorCentoVendido,
        mensagem80PorCentoVendido: agente.mensagem80PorCentoVendido,
        mensagem90PorCentoVendido: agente.mensagem90PorCentoVendido,
        mensagemNovaCampanha: agente.mensagemNovaCampanha,
        mensagemResultado: agente.mensagemResultado,
      },
    });
  }

  async salvar(agente: AgenteChatbot): Promise<void> {
    await this.prisma.agenteChatbot.update({
      where: { id: agente.id },
      data: {
        ativo: agente.ativo,
        avisa50PorCentoVendido: agente.avisa50PorCentoVendido,
        avisa80PorCentoVendido: agente.avisa80PorCentoVendido,
        avisa90PorCentoVendido: agente.avisa90PorCentoVendido,
        avisaNovaCampanha: agente.avisaNovaCampanha,
        avisaResultado: agente.avisaResultado,
        mensagem50PorCentoVendido: agente.mensagem50PorCentoVendido,
        mensagem80PorCentoVendido: agente.mensagem80PorCentoVendido,
        mensagem90PorCentoVendido: agente.mensagem90PorCentoVendido,
        mensagemNovaCampanha: agente.mensagemNovaCampanha,
        mensagemResultado: agente.mensagemResultado,
      },
    });
  }
}

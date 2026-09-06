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
    registro.avisaCotasRestantes,
    registro.avisaNovoSorteio,
    registro.avisaResultado,
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
        avisaCotasRestantes: agente.avisaCotasRestantes,
        avisaNovoSorteio: agente.avisaNovoSorteio,
        avisaResultado: agente.avisaResultado,
      },
    });
  }

  async salvar(agente: AgenteChatbot): Promise<void> {
    await this.prisma.agenteChatbot.update({
      where: { id: agente.id },
      data: {
        ativo: agente.ativo,
        avisaCotasRestantes: agente.avisaCotasRestantes,
        avisaNovoSorteio: agente.avisaNovoSorteio,
        avisaResultado: agente.avisaResultado,
      },
    });
  }
}

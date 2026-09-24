import { Grupo } from '../../domain/entities/grupo.entity';
import { AgenteChatbot } from '../../domain/entities/agente-chatbot.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { AgenteChatbotRepository } from '../../domain/repositories/agente-chatbot.repository';
import { DesativarAgenteChatbotUseCase } from './desativar-agente-chatbot.use-case';

describe('DesativarAgenteChatbotUseCase', () => {
  function criarDependencias(grupo: Grupo | null, agente: AgenteChatbot | null) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const agenteChatbotRepository: AgenteChatbotRepository = {
      buscarPorGrupoId: jest.fn().mockResolvedValue(agente),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { grupoRepository, agenteChatbotRepository };
  }

  it('desativa o agente chatbot do grupo', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const agente = new AgenteChatbot('agente-1', 'grupo-1', true, true, true, true);
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, agente);
    const useCase = new DesativarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(agente.ativo).toBe(false);
    expect(agenteChatbotRepository.salvar).toHaveBeenCalledWith(agente);
  });

  it('rejeita quando o grupo não pertence ao administrador solicitante', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, null);
    const useCase = new DesativarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo não possui agente chatbot', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, null);
    const useCase = new DesativarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('não possui um agente chatbot');
  });
});

import { Grupo } from '../../domain/entities/grupo.entity';
import { AgenteChatbot } from '../../domain/entities/agente-chatbot.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { AgenteChatbotRepository } from '../../domain/repositories/agente-chatbot.repository';
import { CriarAgenteChatbotUseCase } from './criar-agente-chatbot.use-case';

describe('CriarAgenteChatbotUseCase', () => {
  function criarDependencias(grupo: Grupo | null, agenteExistente: AgenteChatbot | null = null) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const agenteChatbotRepository: AgenteChatbotRepository = {
      buscarPorGrupoId: jest.fn().mockResolvedValue(agenteExistente),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };

    return { grupoRepository, agenteChatbotRepository };
  }

  it('cria um agente chatbot ativo por padrão', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo);
    const useCase = new CriarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado.agenteId).toBeDefined();
    const agenteCriado = (agenteChatbotRepository.criar as jest.Mock).mock
      .calls[0][0] as AgenteChatbot;
    expect(agenteCriado.ativo).toBe(true);
  });

  it('rejeita quando o grupo não existe', async () => {
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(null);
    const useCase = new CriarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'inexistente' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo);
    const useCase = new CriarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo já possui um agente chatbot', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const agenteExistente = new AgenteChatbot('agente-1', 'grupo-1', true, true, true, true);
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, agenteExistente);
    const useCase = new CriarAgenteChatbotUseCase(grupoRepository, agenteChatbotRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('já possui um agente chatbot');
  });
});

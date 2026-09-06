import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { AgenteChatbot } from '../../domain/entities/agente-chatbot.entity';
import { AgenteChatbotRepository } from '../../domain/repositories/agente-chatbot.repository';
import { BuscarGrupoUseCase } from './buscar-grupo.use-case';

describe('BuscarGrupoUseCase', () => {
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
      salvar: jest.fn(),
    };

    return { grupoRepository, agenteChatbotRepository };
  }

  it('retorna os detalhes do grupo com o agente chatbot quando existe', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date('2026-01-01'));
    const agente = new AgenteChatbot('agente-1', 'grupo-1', true, true, false, true);
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, agente);
    const useCase = new BuscarGrupoUseCase(grupoRepository, agenteChatbotRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado.nome).toBe('Amigos do bem');
    expect(resultado.agenteChatbot).toEqual({
      ativo: true,
      avisaCotasRestantes: true,
      avisaNovoSorteio: false,
      avisaResultado: true,
    });
  });

  it('retorna agenteChatbot nulo quando o grupo não tem agente', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, null);
    const useCase = new BuscarGrupoUseCase(grupoRepository, agenteChatbotRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado.agenteChatbot).toBeNull();
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository } = criarDependencias(grupo, null);
    const useCase = new BuscarGrupoUseCase(grupoRepository, agenteChatbotRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

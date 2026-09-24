import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { AgenteChatbot } from '../../domain/entities/agente-chatbot.entity';
import { AgenteChatbotRepository } from '../../domain/repositories/agente-chatbot.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { ListarAlertasAutomaticosUseCase } from './listar-alertas-automaticos.use-case';

describe('ListarAlertasAutomaticosUseCase', () => {
  function criarCampanha(id: string, grupoId: string, status: Campanha['status']): Campanha {
    return new Campanha(
      id,
      'admin-1',
      grupoId,
      'Campanha de Natal',
      'desc',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'ESCOLHA_NUMERO',
      status,
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarDependencias(
    grupos: Grupo[],
    campanhasPorGrupo: Record<string, Campanha[]>,
    agentesPorGrupo: Record<string, AgenteChatbot | null>,
  ) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(grupos),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockImplementation(async (grupoId: string) => campanhasPorGrupo[grupoId] ?? []),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const agenteChatbotRepository: AgenteChatbotRepository = {
      buscarPorGrupoId: jest.fn().mockImplementation(async (grupoId: string) => agentesPorGrupo[grupoId] ?? null),
      criar: jest.fn(),
      salvar: jest.fn(),
    };

    return { grupoRepository, campanhaRepository, agenteChatbotRepository };
  }

  it('retorna apenas os grupos com campanha liberada, com os avisos do agente', async () => {
    const grupoA = new Grupo('grupo-a', 'admin-1', 'Amigos do bem', '5511900000001', new Date());
    const grupoB = new Grupo('grupo-b', 'admin-1', 'Família', '5511900000002', new Date());
    const agenteA = new AgenteChatbot('agente-a', 'grupo-a', true, true, false, true);
    const deps = criarDependencias(
      [grupoA, grupoB],
      {
        'grupo-a': [criarCampanha('campanha-a', 'grupo-a', 'LIBERADA')],
        'grupo-b': [criarCampanha('campanha-b', 'grupo-b', 'FINALIZADA')],
      },
      { 'grupo-a': agenteA },
    );
    const useCase = new ListarAlertasAutomaticosUseCase(
      deps.grupoRepository,
      deps.campanhaRepository,
      deps.agenteChatbotRepository,
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([
      {
        grupoId: 'grupo-a',
        nomeGrupo: 'Amigos do bem',
        campanhaAtivaNome: 'Campanha de Natal',
        agenteChatbot: {
          ativo: true,
          avisaCotasRestantes: true,
          avisaNovaCampanha: false,
          avisaResultado: true,
        },
      },
    ]);
  });

  it('retorna agenteChatbot nulo quando o grupo ainda não tem agente configurado', async () => {
    const grupoA = new Grupo('grupo-a', 'admin-1', 'Amigos do bem', '5511900000001', new Date());
    const deps = criarDependencias(
      [grupoA],
      { 'grupo-a': [criarCampanha('campanha-a', 'grupo-a', 'LIBERADA')] },
      {},
    );
    const useCase = new ListarAlertasAutomaticosUseCase(
      deps.grupoRepository,
      deps.campanhaRepository,
      deps.agenteChatbotRepository,
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado[0].agenteChatbot).toBeNull();
  });

  it('retorna lista vazia quando nenhum grupo tem campanha liberada', async () => {
    const grupoA = new Grupo('grupo-a', 'admin-1', 'Amigos do bem', '5511900000001', new Date());
    const deps = criarDependencias([grupoA], { 'grupo-a': [] }, {});
    const useCase = new ListarAlertasAutomaticosUseCase(
      deps.grupoRepository,
      deps.campanhaRepository,
      deps.agenteChatbotRepository,
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual([]);
  });
});

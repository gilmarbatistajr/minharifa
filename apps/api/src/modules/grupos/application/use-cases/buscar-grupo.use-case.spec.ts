import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { AgenteChatbot } from '../../domain/entities/agente-chatbot.entity';
import { AgenteChatbotRepository } from '../../domain/repositories/agente-chatbot.repository';
import { LinkConvite } from '../../domain/entities/link-convite.entity';
import { LinkConviteRepository } from '../../domain/repositories/link-convite.repository';
import { BuscarGrupoUseCase } from './buscar-grupo.use-case';

describe('BuscarGrupoUseCase', () => {
  function criarDependencias(
    grupo: Grupo | null,
    agente: AgenteChatbot | null,
    linkConvite: LinkConvite | null = null,
  ) {
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
    const linkConviteRepository: LinkConviteRepository = {
      buscarPorId: jest.fn(),
      buscarPorCodigo: jest.fn(),
      buscarAtivoPorGrupo: jest.fn().mockResolvedValue(linkConvite),
      criar: jest.fn(),
      salvar: jest.fn(),
    };

    return { grupoRepository, agenteChatbotRepository, linkConviteRepository };
  }

  it('retorna os detalhes do grupo com o agente chatbot e o link de convite quando existem', async () => {
    const grupo = new Grupo(
      'grupo-1',
      'admin-1',
      'Amigos do bem',
      '5511999999999',
      new Date('2026-01-01'),
      'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv',
    );
    const agente = new AgenteChatbot('agente-1', 'grupo-1', true, true, false, true);
    const linkConvite = new LinkConvite('link-1', 'grupo-1', 'ABC123DEFG', 'ATIVO', new Date());
    const { grupoRepository, agenteChatbotRepository, linkConviteRepository } = criarDependencias(
      grupo,
      agente,
      linkConvite,
    );
    const useCase = new BuscarGrupoUseCase(grupoRepository, agenteChatbotRepository, linkConviteRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado.nome).toBe('Amigos do bem');
    expect(resultado.linkWhatsapp).toBe('https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv');
    expect(resultado.codigoConvite).toBe('ABC123DEFG');
    expect(resultado.agenteChatbot).toEqual({
      ativo: true,
      avisaCotasRestantes: true,
      avisaNovaCampanha: false,
      avisaResultado: true,
    });
  });

  it('retorna agenteChatbot e codigoConvite nulos quando o grupo não tem nenhum dos dois', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository, linkConviteRepository } = criarDependencias(
      grupo,
      null,
      null,
    );
    const useCase = new BuscarGrupoUseCase(grupoRepository, agenteChatbotRepository, linkConviteRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado.agenteChatbot).toBeNull();
    expect(resultado.codigoConvite).toBeNull();
    expect(resultado.linkWhatsapp).toBeNull();
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, agenteChatbotRepository, linkConviteRepository } = criarDependencias(
      grupo,
      null,
      null,
    );
    const useCase = new BuscarGrupoUseCase(grupoRepository, agenteChatbotRepository, linkConviteRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

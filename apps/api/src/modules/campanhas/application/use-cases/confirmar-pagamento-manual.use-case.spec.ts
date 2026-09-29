import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { AgenteChatbot } from '../../../grupos/domain/entities/agente-chatbot.entity';
import { AgenteChatbotRepository } from '../../../grupos/domain/repositories/agente-chatbot.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { ConfirmarPagamentoManualUseCase } from './confirmar-pagamento-manual.use-case';

describe('ConfirmarPagamentoManualUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      'grupo-1',
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      10,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarCota(numero: number): Cota {
    return new Cota(`cota-${numero}`, 'campanha-1', numero, 'RESERVADA', 'comprador-1', new Date(), null);
  }

  function criarDependencias(
    campanha: Campanha | null,
    cotasReservadas: Cota[],
    agente: AgenteChatbot | null = null,
  ) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue([]),
      listarReservadasPorComprador: jest.fn().mockResolvedValue(cotasReservadas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn().mockResolvedValue([]),
      criar: jest.fn(),
    };
    const agenteChatbotRepository: AgenteChatbotRepository = {
      buscarPorGrupoId: jest.fn().mockResolvedValue(agente),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const notificationSender: NotificationSender = {
      enviarEmail: jest.fn(),
      enviarWhatsapp: jest.fn().mockResolvedValue(undefined),
    };

    return { campanhaRepository, cotaRepository, grupoRepository, agenteChatbotRepository, notificationSender };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new ConfirmarPagamentoManualUseCase(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
    );
  }

  it('confirma todas as cotas reservadas do comprador como pagas', async () => {
    const campanha = criarCampanha();
    const cotas = [criarCota(1), criarCota(2), criarCota(3)];
    const deps = criarDependencias(campanha, cotas);
    const useCase = montarUseCase(deps);

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' });

    expect(cotas.every((cota) => cota.status === 'PAGA')).toBe(true);
    expect(deps.cotaRepository.salvar).toHaveBeenCalledTimes(3);
  });

  it('libera a campanha para sorteio quando a confirmação manual paga a última cota em aberto', async () => {
    const campanha = criarCampanha();
    const cota = criarCota(1);
    const deps = criarDependencias(campanha, [cota]);
    (deps.cotaRepository.listarPorCampanha as jest.Mock).mockResolvedValue([cota]);
    const useCase = montarUseCase(deps);

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' });

    expect(campanha.status).toBe('LIBERADA_PARA_SORTEIO');
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('dispara o alerta de cotas vendidas do agente chatbot do grupo quando um limiar é cruzado', async () => {
    const campanha = criarCampanha();
    const cotaAConfirmar = criarCota(1);
    const cotasJaPagas = [2, 3, 4, 5].map(
      (numero) => new Cota(`cota-${numero}`, 'campanha-1', numero, 'PAGA', 'comprador-2', new Date(), new Date()),
    );
    const agente = new AgenteChatbot(
      'agente-1',
      'grupo-1',
      true,
      true,
      true,
      true,
      'Metade das cotas já foi vendida!',
    );
    const deps = criarDependencias(campanha, [cotaAConfirmar], agente);
    (deps.cotaRepository.listarPorCampanha as jest.Mock).mockResolvedValue([cotaAConfirmar, ...cotasJaPagas]);
    (deps.grupoRepository.listarCompradores as jest.Mock).mockResolvedValue([
      { id: 'comprador-1', nome: 'Maria', telefone: '11988887777' },
    ]);
    const useCase = montarUseCase(deps);

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' });

    expect(deps.notificationSender.enviarWhatsapp).toHaveBeenCalledWith(
      '11988887777',
      'Metade das cotas já foi vendida!',
    );
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const deps = criarDependencias(campanha, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando o comprador não tem cotas reservadas', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1', compradorId: 'comprador-1' }),
    ).rejects.toThrow('Este comprador não tem cotas reservadas nesta campanha.');
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { AgenteChatbot } from '../../../grupos/domain/entities/agente-chatbot.entity';
import { AgenteChatbotRepository } from '../../../grupos/domain/repositories/agente-chatbot.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { dispararAlertasCotasVendidas } from './disparar-alertas-cotas-vendidas';

describe('dispararAlertasCotasVendidas', () => {
  function criarCampanha(overrides: Partial<{ grupoId: string | null }> = {}): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      overrides.grupoId === undefined ? 'grupo-1' : overrides.grupoId,
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

  function criarCotas(quantidade: number, quantidadePagas: number): Cota[] {
    return Array.from({ length: quantidade }, (_, indice) => {
      const numero = indice + 1;
      const status = numero <= quantidadePagas ? 'PAGA' : 'DISPONIVEL';
      return new Cota(`cota-${numero}`, 'campanha-1', numero, status, null, null, null);
    });
  }

  function criarAgente(overrides: Partial<AgenteChatbot> = {}): AgenteChatbot {
    const agente = new AgenteChatbot(
      'agente-1',
      'grupo-1',
      true,
      true,
      true,
      true,
      'Metade das cotas já foi vendida!',
      'Nova campanha no ar!',
      'Já temos um vencedor!',
      true,
      true,
      '80% das cotas já foram vendidas!',
      '90% das cotas já foram vendidas!',
    );
    return Object.assign(agente, overrides);
  }

  function criarDependencias(
    cotas: Cota[],
    agente: AgenteChatbot | null,
    compradores: { id: string; nome: string; telefone: string }[] = [
      { id: 'comprador-1', nome: 'Maria', telefone: '11988887777' },
    ],
  ) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      listarReservadasPorComprador: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn().mockResolvedValue(compradores),
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

  it('dispara o alerta de 50% e marca a campanha para não repetir depois', async () => {
    const campanha = criarCampanha();
    const cotas = criarCotas(10, 5); // exatamente 50%
    const agente = criarAgente();
    const deps = criarDependencias(cotas, agente);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(campanha.alerta50PorCentoEnviado).toBe(true);
    expect(campanha.alerta80PorCentoEnviado).toBe(false);
    expect(deps.notificationSender.enviarWhatsapp).toHaveBeenCalledWith(
      '11988887777',
      'Metade das cotas já foi vendida!',
    );
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('dispara todos os limiares cruzados de uma vez quando o pagamento pula direto para 90%', async () => {
    const campanha = criarCampanha();
    const cotas = criarCotas(10, 9); // 90%
    const agente = criarAgente();
    const deps = criarDependencias(cotas, agente);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(campanha.alerta50PorCentoEnviado).toBe(true);
    expect(campanha.alerta80PorCentoEnviado).toBe(true);
    expect(campanha.alerta90PorCentoEnviado).toBe(true);
    expect(deps.notificationSender.enviarWhatsapp).toHaveBeenCalledTimes(3);
  });

  it('não dispara de novo um limiar já alertado antes', async () => {
    const campanha = criarCampanha();
    campanha.marcarLimiarDeCotasVendidasAlertado(50);
    const cotas = criarCotas(10, 5);
    const agente = criarAgente();
    const deps = criarDependencias(cotas, agente);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(deps.notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });

  it('não dispara quando o alerta de 50% está desabilitado no agente, mas ainda marca como alertado', async () => {
    const campanha = criarCampanha();
    const cotas = criarCotas(10, 5);
    const agente = criarAgente({ avisa50PorCentoVendido: false });
    const deps = criarDependencias(cotas, agente);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(deps.notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
    expect(campanha.alerta50PorCentoEnviado).toBe(true);
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('não faz nada quando a campanha ainda não tem grupo', async () => {
    const campanha = criarCampanha({ grupoId: null });
    const deps = criarDependencias([], null);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(deps.cotaRepository.listarPorCampanha).not.toHaveBeenCalled();
    expect(deps.notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
  });

  it('não faz nada quando o grupo não tem agente chatbot configurado', async () => {
    const campanha = criarCampanha();
    const cotas = criarCotas(10, 5);
    const deps = criarDependencias(cotas, null);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(deps.notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });

  it('não faz nada quando o agente chatbot está desativado', async () => {
    const campanha = criarCampanha();
    const cotas = criarCotas(10, 5);
    const agente = criarAgente({ ativo: false });
    const deps = criarDependencias(cotas, agente);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(deps.notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });

  it('não faz nada quando ainda não há cota nenhuma paga o suficiente para cruzar 50%', async () => {
    const campanha = criarCampanha();
    const cotas = criarCotas(10, 4); // 40%
    const agente = criarAgente();
    const deps = criarDependencias(cotas, agente);

    await dispararAlertasCotasVendidas(
      deps.campanhaRepository,
      deps.cotaRepository,
      deps.grupoRepository,
      deps.agenteChatbotRepository,
      deps.notificationSender,
      campanha,
    );

    expect(deps.notificationSender.enviarWhatsapp).not.toHaveBeenCalled();
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });
});

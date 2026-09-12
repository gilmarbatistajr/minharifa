import { AgenteChatbot } from './agente-chatbot.entity';

describe('AgenteChatbot', () => {
  function criarAgente(): AgenteChatbot {
    return new AgenteChatbot('agente-1', 'grupo-1', true, true, true, true);
  }

  it('ativa o agente', () => {
    const agente = new AgenteChatbot('agente-1', 'grupo-1', false, true, true, true);

    agente.ativar();

    expect(agente.ativo).toBe(true);
  });

  it('desativa o agente', () => {
    const agente = criarAgente();

    agente.desativar();

    expect(agente.ativo).toBe(false);
  });

  it('configura apenas os avisos informados, preservando os demais', () => {
    const agente = criarAgente();

    agente.configurarAvisos({ avisaCotasRestantes: false });

    expect(agente.avisaCotasRestantes).toBe(false);
    expect(agente.avisaNovoSorteio).toBe(true);
    expect(agente.avisaResultado).toBe(true);
  });

  it('configura múltiplos avisos de uma vez', () => {
    const agente = criarAgente();

    agente.configurarAvisos({ avisaNovoSorteio: false, avisaResultado: false });

    expect(agente.avisaNovoSorteio).toBe(false);
    expect(agente.avisaResultado).toBe(false);
    expect(agente.avisaCotasRestantes).toBe(true);
  });
});

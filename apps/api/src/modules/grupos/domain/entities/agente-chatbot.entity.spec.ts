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

    agente.configurarAvisos({ avisa50PorCentoVendido: false });

    expect(agente.avisa50PorCentoVendido).toBe(false);
    expect(agente.avisa80PorCentoVendido).toBe(true);
    expect(agente.avisa90PorCentoVendido).toBe(true);
    expect(agente.avisaNovaCampanha).toBe(true);
    expect(agente.avisaResultado).toBe(true);
  });

  it('configura múltiplos avisos de uma vez', () => {
    const agente = criarAgente();

    agente.configurarAvisos({ avisaNovaCampanha: false, avisaResultado: false });

    expect(agente.avisaNovaCampanha).toBe(false);
    expect(agente.avisaResultado).toBe(false);
    expect(agente.avisa50PorCentoVendido).toBe(true);
  });

  it('configura os avisos de 80% e 90% das cotas vendidas', () => {
    const agente = criarAgente();

    agente.configurarAvisos({ avisa80PorCentoVendido: false, avisa90PorCentoVendido: false });

    expect(agente.avisa80PorCentoVendido).toBe(false);
    expect(agente.avisa90PorCentoVendido).toBe(false);
    expect(agente.avisa50PorCentoVendido).toBe(true);
  });

  it('configura apenas a mensagem informada, preservando as demais', () => {
    const agente = new AgenteChatbot(
      'agente-1',
      'grupo-1',
      true,
      true,
      true,
      true,
      'mensagem 50%',
      'mensagem nova campanha',
      'mensagem resultado',
      true,
      true,
      'mensagem 80%',
      'mensagem 90%',
    );

    agente.configurarAvisos({ mensagem50PorCentoVendido: 'nova mensagem de 50%' });

    expect(agente.mensagem50PorCentoVendido).toBe('nova mensagem de 50%');
    expect(agente.mensagem80PorCentoVendido).toBe('mensagem 80%');
    expect(agente.mensagem90PorCentoVendido).toBe('mensagem 90%');
    expect(agente.mensagemNovaCampanha).toBe('mensagem nova campanha');
    expect(agente.mensagemResultado).toBe('mensagem resultado');
  });
});

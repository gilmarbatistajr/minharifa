import { Notificacao } from '../../domain/entities/notificacao.entity';
import { RepositorioDeNotificacoesEmMemoria } from '../../testing/repositorio-em-memoria';
import { ListarNotificacoesUseCase } from './listar-notificacoes.use-case';

describe('ListarNotificacoesUseCase', () => {
  function notificacao(id: string, administradorId: string, grupoId: string | null, criadoEm: string, lida = false) {
    return new Notificacao(
      id,
      administradorId,
      'campanha-1',
      grupoId,
      'NOVA_VENDA',
      `msg ${id}`,
      lida ? new Date(criadoEm) : null,
      new Date(criadoEm),
    );
  }

  async function montar() {
    const repositorio = new RepositorioDeNotificacoesEmMemoria({
      'operador-1': { administradorId: 'admin-1', grupoIds: ['grupo-1'] },
    });
    await repositorio.criar(notificacao('a', 'admin-1', 'grupo-1', '2026-01-01T10:00:00Z'));
    await repositorio.criar(notificacao('b', 'admin-1', 'grupo-2', '2026-01-02T10:00:00Z', true));
    await repositorio.criar(notificacao('c', 'admin-2', 'grupo-9', '2026-01-03T10:00:00Z'));
    return { repositorio, useCase: new ListarNotificacoesUseCase(repositorio) };
  }

  it('administrador vê todas as notificações da conta, mais recentes primeiro, com o total de não lidas', async () => {
    const { useCase } = await montar();

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado.notificacoes.map((n) => n.id)).toEqual(['b', 'a']);
    expect(resultado.naoLidas).toBe(1);
  });

  it('operador vê só as notificações dos grupos a que tem acesso', async () => {
    const { useCase } = await montar();

    const resultado = await useCase.executar({ operadorId: 'operador-1' });

    expect(resultado.notificacoes.map((n) => n.id)).toEqual(['a']);
    expect(resultado.naoLidas).toBe(1);
  });

  it('respeita o limite informado', async () => {
    const { useCase } = await montar();

    const resultado = await useCase.executar({ administradorId: 'admin-1', limite: 1 });

    expect(resultado.notificacoes).toHaveLength(1);
  });

  it('rejeita quem não é administrador nem operador conhecido', async () => {
    const { useCase } = await montar();

    await expect(useCase.executar({})).rejects.toThrow('Usuário sem acesso às notificações.');
    await expect(useCase.executar({ operadorId: 'inexistente' })).rejects.toThrow(
      'Usuário sem acesso às notificações.',
    );
  });
});

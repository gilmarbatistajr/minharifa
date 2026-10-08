import { Notificacao } from '../../domain/entities/notificacao.entity';
import { RepositorioDeNotificacoesEmMemoria } from '../../testing/repositorio-em-memoria';
import { MarcarNotificacaoComoLidaUseCase } from './marcar-notificacao-como-lida.use-case';

describe('MarcarNotificacaoComoLidaUseCase', () => {
  const agora = new Date('2026-01-05T10:00:00Z');

  async function montar() {
    const repositorio = new RepositorioDeNotificacoesEmMemoria({
      'operador-1': { administradorId: 'admin-1', grupoIds: ['grupo-1'] },
    });
    const criar = (id: string, administradorId: string, grupoId: string | null) =>
      repositorio.criar(
        new Notificacao(id, administradorId, 'campanha-1', grupoId, 'NOVA_VENDA', 'msg', null, new Date()),
      );
    await criar('n-1', 'admin-1', 'grupo-1');
    await criar('n-2', 'admin-1', 'grupo-2');
    await criar('n-3', 'admin-2', 'grupo-1');
    await criar('n-4', 'admin-1', null);
    return { repositorio, useCase: new MarcarNotificacaoComoLidaUseCase(repositorio) };
  }

  it('administrador marca uma notificação da própria conta como lida', async () => {
    const { repositorio, useCase } = await montar();

    await useCase.executar({ administradorId: 'admin-1', notificacaoId: 'n-1' }, agora);

    expect(repositorio.notificacoes[0].lidaEm).toBe(agora);
  });

  it('não permite marcar a notificação de outro administrador', async () => {
    const { useCase } = await montar();

    await expect(useCase.executar({ administradorId: 'admin-1', notificacaoId: 'n-3' }, agora)).rejects.toThrow(
      'Notificação não encontrada.',
    );
  });

  it('operador marca uma notificação de um grupo dele', async () => {
    const { repositorio, useCase } = await montar();

    await useCase.executar({ operadorId: 'operador-1', notificacaoId: 'n-1' }, agora);

    expect(repositorio.notificacoes[0].lidaEm).toBe(agora);
  });

  it('operador não marca notificação de grupo a que não tem acesso nem sem grupo', async () => {
    const { useCase } = await montar();

    await expect(useCase.executar({ operadorId: 'operador-1', notificacaoId: 'n-2' }, agora)).rejects.toThrow(
      'Notificação não encontrada.',
    );
    await expect(useCase.executar({ operadorId: 'operador-1', notificacaoId: 'n-4' }, agora)).rejects.toThrow(
      'Notificação não encontrada.',
    );
  });

  it('rejeita notificação inexistente', async () => {
    const { useCase } = await montar();

    await expect(useCase.executar({ administradorId: 'admin-1', notificacaoId: 'nada' }, agora)).rejects.toThrow(
      'Notificação não encontrada.',
    );
  });
});

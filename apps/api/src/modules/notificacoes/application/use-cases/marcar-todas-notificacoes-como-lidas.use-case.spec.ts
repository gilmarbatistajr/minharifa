import { Notificacao } from '../../domain/entities/notificacao.entity';
import { RepositorioDeNotificacoesEmMemoria } from '../../testing/repositorio-em-memoria';
import { MarcarTodasNotificacoesComoLidasUseCase } from './marcar-todas-notificacoes-como-lidas.use-case';

describe('MarcarTodasNotificacoesComoLidasUseCase', () => {
  const agora = new Date('2026-01-05T10:00:00Z');

  async function montar() {
    const repositorio = new RepositorioDeNotificacoesEmMemoria({
      'operador-1': { administradorId: 'admin-1', grupoIds: ['grupo-1'] },
    });
    const criar = (id: string, administradorId: string, grupoId: string) =>
      repositorio.criar(
        new Notificacao(id, administradorId, 'campanha-1', grupoId, 'NOVA_VENDA', 'msg', null, new Date()),
      );
    await criar('n-1', 'admin-1', 'grupo-1');
    await criar('n-2', 'admin-1', 'grupo-2');
    await criar('n-3', 'admin-2', 'grupo-1');
    return { repositorio, useCase: new MarcarTodasNotificacoesComoLidasUseCase(repositorio) };
  }

  it('administrador marca todas as da própria conta, sem tocar nas de outra conta', async () => {
    const { repositorio, useCase } = await montar();

    await useCase.executar({ administradorId: 'admin-1' }, agora);

    expect(repositorio.notificacoes.map((n) => n.estaLida())).toEqual([true, true, false]);
  });

  it('operador marca só as dos grupos a que tem acesso', async () => {
    const { repositorio, useCase } = await montar();

    await useCase.executar({ operadorId: 'operador-1' }, agora);

    expect(repositorio.notificacoes.map((n) => n.estaLida())).toEqual([true, false, false]);
  });
});

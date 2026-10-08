import { RepositorioDeNotificacoesEmMemoria } from '../../testing/repositorio-em-memoria';
import { RegistrarNovaVendaUseCase } from './registrar-nova-venda.use-case';

describe('RegistrarNovaVendaUseCase', () => {
  it('cria a notificação de nova venda para o administrador dono da campanha', async () => {
    const repositorio = new RepositorioDeNotificacoesEmMemoria();
    const useCase = new RegistrarNovaVendaUseCase(repositorio);
    const agora = new Date('2026-01-01T10:00:00Z');

    await useCase.executar(
      { administradorId: 'admin-1', campanhaId: 'campanha-1', grupoId: 'grupo-1', nomeCampanha: 'Nishane' },
      agora,
    );

    expect(repositorio.notificacoes).toHaveLength(1);
    expect(repositorio.notificacoes[0]).toMatchObject({
      administradorId: 'admin-1',
      campanhaId: 'campanha-1',
      grupoId: 'grupo-1',
      tipo: 'NOVA_VENDA',
      mensagem: 'Nova venda de cota na campanha Nishane, confirme o pagamento',
      lidaEm: null,
      criadoEm: agora,
    });
  });

  it('gera uma notificação a cada nova venda (sem deduplicar)', async () => {
    const repositorio = new RepositorioDeNotificacoesEmMemoria();
    const useCase = new RegistrarNovaVendaUseCase(repositorio);
    const entrada = { administradorId: 'admin-1', campanhaId: 'campanha-1', grupoId: null, nomeCampanha: 'Nishane' };

    await useCase.executar(entrada);
    await useCase.executar(entrada);

    expect(repositorio.notificacoes).toHaveLength(2);
  });
});

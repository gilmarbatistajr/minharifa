import { RepositorioDeNotificacoesEmMemoria } from '../../testing/repositorio-em-memoria';
import { RegistrarMarcosDeVendaUseCase } from './registrar-marcos-de-venda.use-case';

describe('RegistrarMarcosDeVendaUseCase', () => {
  const base = { administradorId: 'admin-1', campanhaId: 'campanha-1', grupoId: 'grupo-1', nomeCampanha: 'Nishane' };

  function montar() {
    const repositorio = new RepositorioDeNotificacoesEmMemoria();
    return { repositorio, useCase: new RegistrarMarcosDeVendaUseCase(repositorio) };
  }

  const mensagens = (r: RepositorioDeNotificacoesEmMemoria) => r.notificacoes.map((n) => n.mensagem);

  it('não notifica abaixo de 20%', async () => {
    const { repositorio, useCase } = montar();

    await useCase.executar({ ...base, percentualVendido: 19 });

    expect(repositorio.notificacoes).toHaveLength(0);
  });

  it('notifica 20% ao atingir o marco', async () => {
    const { repositorio, useCase } = montar();

    await useCase.executar({ ...base, percentualVendido: 20 });

    expect(mensagens(repositorio)).toEqual(['20% das cotas da campanha Nishane vendidas']);
  });

  it('notifica 50%, 75% e 90% nos respectivos marcos', async () => {
    const { repositorio, useCase } = montar();

    await useCase.executar({ ...base, percentualVendido: 20 });
    await useCase.executar({ ...base, percentualVendido: 50 });
    await useCase.executar({ ...base, percentualVendido: 75 });
    await useCase.executar({ ...base, percentualVendido: 90 });

    expect(repositorio.notificacoes.map((n) => n.tipo)).toEqual([
      'COTAS_VENDIDAS_20',
      'COTAS_VENDIDAS_50',
      'COTAS_VENDIDAS_75',
      'COTAS_VENDIDAS_90',
    ]);
  });

  it('notifica quando todas as cotas foram vendidas', async () => {
    const { repositorio, useCase } = montar();

    await useCase.executar({ ...base, percentualVendido: 100 });

    expect(mensagens(repositorio)).toContain('Todas as cotas da campanha Nishane foram vendidas');
  });

  it('avisa todos os marcos pulados de uma vez, sem repetir nenhum depois', async () => {
    const { repositorio, useCase } = montar();

    await useCase.executar({ ...base, percentualVendido: 55 });
    await useCase.executar({ ...base, percentualVendido: 56 });

    expect(repositorio.notificacoes.map((n) => n.tipo)).toEqual(['COTAS_VENDIDAS_20', 'COTAS_VENDIDAS_50']);
  });

  it('controla os marcos separadamente por campanha', async () => {
    const { repositorio, useCase } = montar();

    await useCase.executar({ ...base, percentualVendido: 20 });
    await useCase.executar({ ...base, campanhaId: 'campanha-2', percentualVendido: 20 });

    expect(repositorio.notificacoes).toHaveLength(2);
  });
});

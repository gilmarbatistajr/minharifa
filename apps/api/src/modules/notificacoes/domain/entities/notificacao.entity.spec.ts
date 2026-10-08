import { Notificacao, tipoDoMarco } from './notificacao.entity';

describe('Notificacao', () => {
  function criar(): Notificacao {
    return new Notificacao('n-1', 'admin-1', 'campanha-1', 'grupo-1', 'NOVA_VENDA', 'msg', null, new Date());
  }

  it('começa não lida e passa a lida ao ser marcada, sem alterar a data se marcada de novo', () => {
    const notificacao = criar();
    expect(notificacao.estaLida()).toBe(false);

    const primeira = new Date('2026-01-01T10:00:00Z');
    notificacao.marcarComoLida(primeira);
    notificacao.marcarComoLida(new Date('2026-01-02T10:00:00Z'));

    expect(notificacao.estaLida()).toBe(true);
    expect(notificacao.lidaEm).toBe(primeira);
  });

  it('monta a mensagem de nova venda', () => {
    expect(Notificacao.mensagemNovaVenda('Nishane')).toBe(
      'Nova venda de cota na campanha Nishane, confirme o pagamento',
    );
  });

  it('monta a mensagem dos marcos de cotas vendidas', () => {
    expect(Notificacao.mensagemMarco(20, 'Nishane')).toBe('20% das cotas da campanha Nishane vendidas');
    expect(Notificacao.mensagemMarco(75, 'Nishane')).toBe('75% das cotas da campanha Nishane vendidas');
    expect(Notificacao.mensagemMarco(100, 'Nishane')).toBe('Todas as cotas da campanha Nishane foram vendidas');
  });

  it('converte o marco no tipo da notificação', () => {
    expect(tipoDoMarco(90)).toBe('COTAS_VENDIDAS_90');
  });
});

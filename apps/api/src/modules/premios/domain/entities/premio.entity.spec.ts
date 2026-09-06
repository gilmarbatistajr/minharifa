import { Premio } from './premio.entity';

describe('Premio', () => {
  function criarPremio(): Premio {
    return new Premio(
      'premio-1',
      'admin-1',
      'iPhone 16 Pro',
      'Um belo iPhone',
      'https://exemplo.com/foto.png',
      8000,
      null,
      new Date(),
    );
  }

  describe('pertenceAoAdministrador', () => {
    it('retorna true quando o administrador é o dono do prêmio', () => {
      expect(criarPremio().pertenceAoAdministrador('admin-1')).toBe(true);
    });

    it('retorna false quando o administrador não é o dono', () => {
      expect(criarPremio().pertenceAoAdministrador('admin-2')).toBe(false);
    });
  });

  describe('atualizar', () => {
    it('atualiza o valor do prêmio', () => {
      const premio = criarPremio();

      premio.atualizar({ valor: 7500 });

      expect(premio.valor).toBe(7500);
    });

    it('rejeita valor menor ou igual a zero', () => {
      const premio = criarPremio();

      expect(() => premio.atualizar({ valor: -100 })).toThrow('maior que zero');
    });

    it('habilita a opção de troca por dinheiro', () => {
      const premio = criarPremio();

      premio.atualizar({ valorOpcaoDinheiro: 7800 });

      expect(premio.valorOpcaoDinheiro).toBe(7800);
    });

    it('atualiza nome, descrição e foto simultaneamente', () => {
      const premio = criarPremio();

      premio.atualizar({
        nome: 'iPhone 16 Pro Max',
        descricao: 'Nova descrição',
        fotoUrl: 'https://exemplo.com/nova-foto.png',
      });

      expect(premio.nome).toBe('iPhone 16 Pro Max');
      expect(premio.descricao).toBe('Nova descrição');
      expect(premio.fotoUrl).toBe('https://exemplo.com/nova-foto.png');
    });
  });
});

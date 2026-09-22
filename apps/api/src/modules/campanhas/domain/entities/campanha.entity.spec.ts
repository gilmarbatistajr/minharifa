import { Campanha, StatusCampanha, StatusVendasCampanha, FormaVendaCotas } from './campanha.entity';

interface CampanhaOverrides {
  id: string;
  administradorId: string;
  grupoId: string | null;
  nome: string;
  descricao: string;
  premioIds: string[];
  dataAberturaVendas: Date | null;
  dataEncerramentoVendas: Date | null;
  dataRealizacao: Date | null;
  quantidadeCotas: number;
  valorCota: number;
  formaVenda: FormaVendaCotas;
  status: StatusCampanha;
  statusVendas: StatusVendasCampanha;
  cotaVencedoraNumero: number | null;
  vencedorOptouPorDinheiro: boolean | null;
}

function criarCampanha(overrides: Partial<CampanhaOverrides> = {}): Campanha {
  const padrao: CampanhaOverrides = {
    id: 'campanha-1',
    administradorId: 'admin-1',
    grupoId: 'grupo-1',
    nome: 'Campanha de teste',
    descricao: 'Descrição de teste',
    premioIds: ['premio-1'],
    dataAberturaVendas: new Date('2026-01-01T00:00:00Z'),
    dataEncerramentoVendas: new Date('2026-01-10T00:00:00Z'),
    dataRealizacao: new Date('2026-01-11T00:00:00Z'),
    quantidadeCotas: 100,
    valorCota: 50,
    formaVenda: 'ESCOLHA_NUMERO',
    status: 'LIBERADA',
    statusVendas: 'VENDAS_ABERTAS',
    cotaVencedoraNumero: null,
    vencedorOptouPorDinheiro: null,
  };
  const dados = { ...padrao, ...overrides };

  return new Campanha(
    dados.id,
    dados.administradorId,
    dados.grupoId,
    dados.nome,
    dados.descricao,
    dados.premioIds,
    dados.dataAberturaVendas,
    dados.dataEncerramentoVendas,
    dados.dataRealizacao,
    dados.quantidadeCotas,
    dados.valorCota,
    dados.formaVenda,
    dados.status,
    dados.statusVendas,
    dados.cotaVencedoraNumero,
    dados.vencedorOptouPorDinheiro,
  );
}

describe('Campanha', () => {
  describe('marcarComoRevisada', () => {
    it('move uma campanha nova para aguardando liberação', () => {
      const campanha = criarCampanha({ status: 'NOVO', grupoId: null });

      campanha.marcarComoRevisada();

      expect(campanha.status).toBe('AGUARDANDO_LIBERACAO');
    });

    it('rejeita marcar como revisada uma campanha que não está NOVA', () => {
      const campanha = criarCampanha({ status: 'AGUARDANDO_LIBERACAO', grupoId: null });

      expect(() => campanha.marcarComoRevisada()).toThrow('Somente campanhas novas');
    });
  });

  describe('atualizar', () => {
    const novosDados = {
      nome: 'Campanha editada',
      descricao: 'Descrição editada',
      telefoneSuporte: '5511988887777',
      premioIds: ['premio-2', 'premio-3'],
      quantidadeCotas: 200,
      valorCota: 99,
      formaVenda: 'LOTE_FECHADO' as const,
      quantidadeMinimaPorCompra: 2,
      quantidadeMaximaPorCompra: 10,
      expiracaoReservaMinutos: 30,
      reservaExigeEmail: false,
      reservaExigeNome: false,
      reservaExigeTelefone: false,
      reservaExigeConfirmacaoTelefone: true,
    };

    it('substitui todos os dados editáveis de uma campanha nova', () => {
      const campanha = criarCampanha({ status: 'NOVO', grupoId: null });

      campanha.atualizar(novosDados);

      expect(campanha.nome).toBe('Campanha editada');
      expect(campanha.descricao).toBe('Descrição editada');
      expect(campanha.telefoneSuporte).toBe('5511988887777');
      expect(campanha.premioIds).toEqual(['premio-2', 'premio-3']);
      expect(campanha.quantidadeCotas).toBe(200);
      expect(campanha.valorCota).toBe(99);
      expect(campanha.formaVenda).toBe('LOTE_FECHADO');
      expect(campanha.quantidadeMinimaPorCompra).toBe(2);
      expect(campanha.quantidadeMaximaPorCompra).toBe(10);
      expect(campanha.expiracaoReservaMinutos).toBe(30);
      expect(campanha.reservaExigeEmail).toBe(false);
      expect(campanha.reservaExigeConfirmacaoTelefone).toBe(true);
    });

    it('rejeita editar uma campanha que não está mais NOVA', () => {
      const campanha = criarCampanha({ status: 'AGUARDANDO_LIBERACAO', grupoId: null });

      expect(() => campanha.atualizar(novosDados)).toThrow('Somente campanhas novas podem ser editadas.');
    });
  });

  describe('lancar', () => {
    function criarCampanhaAguardandoLiberacao(): Campanha {
      return criarCampanha({
        status: 'AGUARDANDO_LIBERACAO',
        grupoId: null,
        dataAberturaVendas: null,
        dataEncerramentoVendas: null,
        dataRealizacao: null,
      });
    }

    it('vincula o grupo, define as datas e libera a campanha', () => {
      const campanha = criarCampanhaAguardandoLiberacao();

      campanha.lancar(
        'grupo-1',
        new Date('2026-02-01T00:00:00Z'),
        new Date('2026-02-10T00:00:00Z'),
        new Date('2026-02-11T00:00:00Z'),
      );

      expect(campanha.status).toBe('LIBERADA');
      expect(campanha.grupoId).toBe('grupo-1');
      expect(campanha.dataAberturaVendas).toEqual(new Date('2026-02-01T00:00:00Z'));
      expect(campanha.dataEncerramentoVendas).toEqual(new Date('2026-02-10T00:00:00Z'));
      expect(campanha.dataRealizacao).toEqual(new Date('2026-02-11T00:00:00Z'));
    });

    it('rejeita lançar uma campanha que não está aguardando liberação', () => {
      const campanha = criarCampanha({ status: 'NOVO', grupoId: null });

      expect(() =>
        campanha.lancar(
          'grupo-1',
          new Date('2026-02-01T00:00:00Z'),
          new Date('2026-02-10T00:00:00Z'),
          new Date('2026-02-11T00:00:00Z'),
        ),
      ).toThrow('Somente campanhas aguardando liberação');
    });

    it('rejeita quando o encerramento das vendas não é depois da abertura', () => {
      const campanha = criarCampanhaAguardandoLiberacao();

      expect(() =>
        campanha.lancar(
          'grupo-1',
          new Date('2026-02-10T00:00:00Z'),
          new Date('2026-02-05T00:00:00Z'),
          new Date('2026-02-11T00:00:00Z'),
        ),
      ).toThrow('encerramento das vendas deve ser depois da abertura');
    });

    it('rejeita quando a realização é antes do encerramento das vendas', () => {
      const campanha = criarCampanhaAguardandoLiberacao();

      expect(() =>
        campanha.lancar(
          'grupo-1',
          new Date('2026-02-01T00:00:00Z'),
          new Date('2026-02-10T00:00:00Z'),
          new Date('2026-02-05T00:00:00Z'),
        ),
      ).toThrow('data de realização deve ser igual ou depois');
    });

    it('permite lançar sem encerramento das vendas e sem data de realização', () => {
      const campanha = criarCampanhaAguardandoLiberacao();

      campanha.lancar('grupo-1', new Date('2026-02-01T00:00:00Z'), null, null);

      expect(campanha.status).toBe('LIBERADA');
      expect(campanha.dataEncerramentoVendas).toBeNull();
      expect(campanha.dataRealizacao).toBeNull();
    });
  });

  describe('cancelar', () => {
    it('cancela uma campanha com vendas em andamento', () => {
      const campanha = criarCampanha({ statusVendas: 'VENDAS_ABERTAS' });

      campanha.cancelar();

      expect(campanha.statusVendas).toBe('CANCELADO');
    });

    it('impede cancelar uma campanha já finalizada', () => {
      const campanha = criarCampanha({ statusVendas: 'FINALIZADO', status: 'FINALIZADA' });

      expect(() => campanha.cancelar()).toThrow('não pode ser cancelada');
    });

    it('impede cancelar uma campanha já cancelada', () => {
      const campanha = criarCampanha({ statusVendas: 'CANCELADO' });

      expect(() => campanha.cancelar()).toThrow('não pode ser cancelada');
    });
  });

  describe('finalizar', () => {
    const dadosVencedor = { cotaVencedoraNumero: 42, vencedorNome: 'Maria Silva', vencedorTelefone: '11999999999' };

    it('registra a cota vencedora, nome e telefone e marca a campanha como finalizada nos dois status', () => {
      const campanha = criarCampanha({ status: 'LIBERADA', statusVendas: 'COTAS_ESGOTADAS' });

      campanha.finalizar(dadosVencedor, new Date('2026-01-11T00:00:00Z'));

      expect(campanha.status).toBe('FINALIZADA');
      expect(campanha.statusVendas).toBe('FINALIZADO');
      expect(campanha.cotaVencedoraNumero).toBe(42);
      expect(campanha.vencedorNome).toBe('Maria Silva');
      expect(campanha.vencedorTelefone).toBe('11999999999');
    });

    it('impede finalizar uma campanha que ainda não foi liberada', () => {
      const campanha = criarCampanha({ status: 'AGUARDANDO_LIBERACAO', grupoId: null, dataRealizacao: null });

      expect(() => campanha.finalizar(dadosVencedor, new Date('2026-01-11T00:00:00Z'))).toThrow(
        'Somente campanhas liberadas',
      );
    });

    it('impede finalizar antes da data de realização', () => {
      const campanha = criarCampanha({ status: 'LIBERADA' });

      expect(() => campanha.finalizar(dadosVencedor, new Date('2026-01-10T23:59:59Z'))).toThrow(
        'só pode ser finalizada após a data de realização',
      );
    });

    it('impede finalizar uma campanha já finalizada', () => {
      const campanha = criarCampanha({ status: 'LIBERADA', statusVendas: 'FINALIZADO' });

      expect(() => campanha.finalizar(dadosVencedor, new Date('2026-01-11T00:00:00Z'))).toThrow(
        'não pode ser finalizada',
      );
    });

    it('impede finalizar uma campanha cancelada', () => {
      const campanha = criarCampanha({ status: 'LIBERADA', statusVendas: 'CANCELADO' });

      expect(() => campanha.finalizar(dadosVencedor, new Date('2026-01-11T00:00:00Z'))).toThrow(
        'não pode ser finalizada',
      );
    });

    it('rejeita um número de cota fora do intervalo válido', () => {
      const campanha = criarCampanha({ status: 'LIBERADA', statusVendas: 'COTAS_ESGOTADAS' });

      expect(() =>
        campanha.finalizar({ ...dadosVencedor, cotaVencedoraNumero: 0 }, new Date('2026-01-11T00:00:00Z')),
      ).toThrow('número da cota vencedora é inválido');
      expect(() =>
        campanha.finalizar({ ...dadosVencedor, cotaVencedoraNumero: 101 }, new Date('2026-01-11T00:00:00Z')),
      ).toThrow('número da cota vencedora é inválido');
    });

    it('rejeita quando o nome do vencedor não é informado', () => {
      const campanha = criarCampanha({ status: 'LIBERADA', statusVendas: 'COTAS_ESGOTADAS' });

      expect(() =>
        campanha.finalizar({ ...dadosVencedor, vencedorNome: '  ' }, new Date('2026-01-11T00:00:00Z')),
      ).toThrow('Informe o nome do vencedor.');
    });

    it('rejeita quando o telefone do vencedor não é informado', () => {
      const campanha = criarCampanha({ status: 'LIBERADA', statusVendas: 'COTAS_ESGOTADAS' });

      expect(() =>
        campanha.finalizar({ ...dadosVencedor, vencedorTelefone: '  ' }, new Date('2026-01-11T00:00:00Z')),
      ).toThrow('Informe o telefone do vencedor.');
    });
  });

  describe('estaEncerrandoEm24h', () => {
    it('retorna true quando faltam menos de 24h para o encerramento', () => {
      const campanha = criarCampanha({
        statusVendas: 'VENDAS_ABERTAS',
        dataEncerramentoVendas: new Date('2026-01-10T12:00:00Z'),
      });

      expect(campanha.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(true);
    });

    it('retorna false quando faltam mais de 24h', () => {
      const campanha = criarCampanha({
        statusVendas: 'VENDAS_ABERTAS',
        dataEncerramentoVendas: new Date('2026-01-15T00:00:00Z'),
      });

      expect(campanha.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });

    it('retorna false se a campanha não está com vendas abertas', () => {
      const campanha = criarCampanha({
        statusVendas: 'COTAS_ESGOTADAS',
        dataEncerramentoVendas: new Date('2026-01-10T12:00:00Z'),
      });

      expect(campanha.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });

    it('retorna false se a data de encerramento já passou', () => {
      const campanha = criarCampanha({
        statusVendas: 'VENDAS_ABERTAS',
        dataEncerramentoVendas: new Date('2026-01-09T00:00:00Z'),
      });

      expect(campanha.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });

    it('retorna false se a campanha ainda não foi lançada (sem data de encerramento)', () => {
      const campanha = criarCampanha({
        statusVendas: 'AGUARDANDO_ABERTURA',
        dataEncerramentoVendas: null,
      });

      expect(campanha.estaEncerrandoEm24h(new Date('2026-01-10T00:00:00Z'))).toBe(false);
    });
  });

  describe('estaAguardandoResultado', () => {
    it('retorna true quando as cotas estão esgotadas', () => {
      const campanha = criarCampanha({ statusVendas: 'COTAS_ESGOTADAS' });

      expect(campanha.estaAguardandoResultado()).toBe(true);
    });

    it('retorna false em qualquer outro status de vendas', () => {
      const campanha = criarCampanha({ statusVendas: 'VENDAS_ABERTAS' });

      expect(campanha.estaAguardandoResultado()).toBe(false);
    });
  });

  describe('calcularPercentualVendido', () => {
    it('calcula o percentual arredondado de cotas pagas', () => {
      const campanha = criarCampanha({ quantidadeCotas: 200 });

      expect(campanha.calcularPercentualVendido(50)).toBe(25);
    });

    it('retorna 0 quando a campanha não tem cotas', () => {
      const campanha = criarCampanha({ quantidadeCotas: 0 });

      expect(campanha.calcularPercentualVendido(0)).toBe(0);
    });
  });

  describe('permiteEscolhaManual / permiteLoteFechado', () => {
    it('permite apenas escolha manual quando formaVenda é ESCOLHA_NUMERO', () => {
      const campanha = criarCampanha({ formaVenda: 'ESCOLHA_NUMERO' });

      expect(campanha.permiteEscolhaManual()).toBe(true);
      expect(campanha.permiteLoteFechado()).toBe(false);
    });

    it('permite apenas lote fechado quando formaVenda é LOTE_FECHADO', () => {
      const campanha = criarCampanha({ formaVenda: 'LOTE_FECHADO' });

      expect(campanha.permiteEscolhaManual()).toBe(false);
      expect(campanha.permiteLoteFechado()).toBe(true);
    });
  });

  describe('remoção lógica', () => {
    it('marca a campanha como removida', () => {
      const campanha = criarCampanha({ status: 'NOVO' });
      const agora = new Date('2026-01-05T00:00:00Z');

      campanha.remover(agora);

      expect(campanha.estaRemovida()).toBe(true);
      expect(campanha.removidaEm).toEqual(agora);
    });

    it('impede remover uma campanha já removida', () => {
      const campanha = criarCampanha({ status: 'NOVO' });
      campanha.remover(new Date('2026-01-05T00:00:00Z'));

      expect(() => campanha.remover(new Date('2026-01-06T00:00:00Z'))).toThrow('já está removida');
    });

    it('impede remover uma campanha liberada', () => {
      const campanha = criarCampanha({ status: 'LIBERADA' });

      expect(() => campanha.remover(new Date('2026-01-05T00:00:00Z'))).toThrow(
        'Uma campanha liberada não pode ser removida.',
      );
    });

    it('restaura uma campanha removida', () => {
      const campanha = criarCampanha({ status: 'NOVO' });
      campanha.remover(new Date('2026-01-05T00:00:00Z'));

      campanha.restaurar();

      expect(campanha.estaRemovida()).toBe(false);
      expect(campanha.removidaEm).toBeNull();
    });

    it('impede restaurar uma campanha que não está removida', () => {
      const campanha = criarCampanha({ status: 'NOVO' });

      expect(() => campanha.restaurar()).toThrow('não está removida');
    });
  });
});

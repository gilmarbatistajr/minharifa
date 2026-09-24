import { Operador } from './operador.entity';

describe('Operador', () => {
  function criarOperador(): Operador {
    return new Operador(
      'operador-1',
      'admin-1',
      'Maria Souza',
      'Rua das Flores, 123',
      '12345678909',
      'MG-12.345.678',
      '31999998888',
      'maria.souza',
      'hash-atual',
      ['grupo-1'],
      new Date('2026-01-01T00:00:00Z'),
    );
  }

  it('pertenceAoAdministrador confere o dono do operador', () => {
    const operador = criarOperador();

    expect(operador.pertenceAoAdministrador('admin-1')).toBe(true);
    expect(operador.pertenceAoAdministrador('outro-admin')).toBe(false);
  });

  it('atualizar altera apenas os campos informados', () => {
    const operador = criarOperador();

    operador.atualizar({ telefone: '31988887777', grupoIds: ['grupo-1', 'grupo-2'] });

    expect(operador.telefone).toBe('31988887777');
    expect(operador.grupoIds).toEqual(['grupo-1', 'grupo-2']);
    expect(operador.nomeCompleto).toBe('Maria Souza');
    expect(operador.endereco).toBe('Rua das Flores, 123');
  });

  it('atualizar rejeita nome completo vazio', () => {
    const operador = criarOperador();

    expect(() => operador.atualizar({ nomeCompleto: '   ' })).toThrow('Nome completo não pode ser vazio.');
  });

  it('trocarSenha substitui o hash armazenado', () => {
    const operador = criarOperador();

    operador.trocarSenha('novo-hash');

    expect(operador.senhaHash).toBe('novo-hash');
  });

  it('atualizar substitui as permissões', () => {
    const operador = criarOperador();

    operador.atualizar({
      permissoes: [{ recurso: 'CAMPANHAS', podeCriar: true, podeEditar: true, podeRemover: false }],
    });

    expect(operador.permissoes).toEqual([
      { recurso: 'CAMPANHAS', podeCriar: true, podeEditar: true, podeRemover: false },
    ]);
  });
});

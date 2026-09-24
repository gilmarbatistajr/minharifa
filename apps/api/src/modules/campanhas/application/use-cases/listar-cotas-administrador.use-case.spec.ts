import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { ListarCotasParaAdministradorUseCase } from './listar-cotas-administrador.use-case';

describe('ListarCotasParaAdministradorUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      'grupo-1',
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      3,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarCota(numero: number, status: Cota['status'], compradorId: string | null): Cota {
    return new Cota('cota-' + numero, 'campanha-1', numero, status, compradorId, null, null);
  }

  function criarComprador(id: string, nome: string, telefone: string): Comprador {
    return new Comprador(
      id,
      'grupo-1',
      nome,
      null,
      new Date('1990-01-01'),
      telefone,
      `cpf-${id}`,
      'Rua Teste, 1',
      null,
      null,
      0,
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarDependencias(campanha: Campanha | null, cotas: Cota[], compradores: Comprador[]) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      listarReservadasPorComprador: jest.fn(),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn(),
    };
    const compradorRepository: CompradorRepository = {
      buscarPorId: jest.fn((id: string) =>
        Promise.resolve(compradores.find((comprador) => comprador.id === id) ?? null),
      ),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };

    return { campanhaRepository, cotaRepository, compradorRepository };
  }

  it('lista as cotas ordenadas por número com nome e telefone do comprador', async () => {
    const campanha = criarCampanha();
    const cotas = [
      criarCota(2, 'PAGA', 'comprador-1'),
      criarCota(1, 'RESERVADA', 'comprador-2'),
      criarCota(3, 'DISPONIVEL', null),
    ];
    const compradores = [
      criarComprador('comprador-1', 'Maria Silva', '11999990000'),
      criarComprador('comprador-2', 'João Souza', '11988880000'),
    ];
    const { campanhaRepository, cotaRepository, compradorRepository } = criarDependencias(
      campanha,
      cotas,
      compradores,
    );
    const useCase = new ListarCotasParaAdministradorUseCase(
      campanhaRepository,
      cotaRepository,
      compradorRepository,
    );

    const resultado = await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' });

    expect(resultado.map((cota) => cota.numero)).toEqual([1, 2, 3]);
    expect(resultado[0]).toEqual({
      numero: 1,
      status: 'RESERVADA',
      compradorId: 'comprador-2',
      compradorNome: 'João Souza',
      compradorTelefone: '11988880000',
    });
    expect(resultado[2]).toEqual({
      numero: 3,
      status: 'DISPONIVEL',
      compradorId: null,
      compradorNome: null,
      compradorTelefone: null,
    });
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository, cotaRepository, compradorRepository } = criarDependencias(null, [], []);
    const useCase = new ListarCotasParaAdministradorUseCase(
      campanhaRepository,
      cotaRepository,
      compradorRepository,
    );

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const { campanhaRepository, cotaRepository, compradorRepository } = criarDependencias(campanha, [], []);
    const useCase = new ListarCotasParaAdministradorUseCase(
      campanhaRepository,
      cotaRepository,
      compradorRepository,
    );

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });
});

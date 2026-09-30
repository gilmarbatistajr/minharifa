import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { BuscarCampanhaPublicaUseCase } from './buscar-campanha-publica.use-case';

describe('BuscarCampanhaPublicaUseCase', () => {
  function criarCampanha(overrides: Partial<{ grupoId: string | null; removidaEm: Date | null }> = {}): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      overrides.grupoId === undefined ? 'grupo-1' : overrides.grupoId,
      'Campanha de teste',
      'Descrição de teste',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
      overrides.removidaEm ?? null,
      '11999998888',
      1,
      10,
      2,
      true,
      true,
      true,
      false,
      'https://exemplo.com/foto.png',
      null,
      null,
      false,
      false,
      false,
      'CPF',
      '12345678900',
    );
  }

  function criarDependencias(campanha: Campanha | null) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    return { campanhaRepository };
  }

  it('retorna só os campos públicos da campanha, sem dados sensíveis', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository);

    const resultado = await useCase.executar({ campanhaId: 'campanha-1' });

    expect(resultado).toEqual({
      id: 'campanha-1',
      nome: 'Campanha de teste',
      descricao: 'Descrição de teste',
      fotoUrl: 'https://exemplo.com/foto.png',
      valorCota: 50,
      quantidadeCotas: 100,
      quantidadeMinimaPorCompra: 1,
      quantidadeMaximaPorCompra: 10,
      formaVenda: 'ESCOLHA_NUMERO',
      telefoneSuporte: '11999998888',
      status: 'LIBERADA',
      statusVendas: 'VENDAS_ABERTAS',
      dataRealizacao: campanha.dataRealizacao,
      reservaExigeEmail: true,
      reservaExigeNome: true,
      reservaExigeTelefone: true,
      reservaExigeConfirmacaoTelefone: false,
    });
    expect(resultado).not.toHaveProperty('chavePix');
    expect(resultado).not.toHaveProperty('tipoChavePix');
    expect(resultado).not.toHaveProperty('administradorId');
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository } = criarDependencias(null);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository);

    await expect(useCase.executar({ campanhaId: 'inexistente' })).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha ainda não foi lançada para um grupo', async () => {
    const campanha = criarCampanha({ grupoId: null });
    const { campanhaRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository);

    await expect(useCase.executar({ campanhaId: 'campanha-1' })).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha foi removida', async () => {
    const campanha = criarCampanha({ removidaEm: new Date('2026-01-01T00:00:00Z') });
    const { campanhaRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository);

    await expect(useCase.executar({ campanhaId: 'campanha-1' })).rejects.toThrow('Campanha não encontrada.');
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Grupo } from '../../../grupos/domain/entities/grupo.entity';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { BuscarCampanhaPublicaUseCase } from './buscar-campanha-publica.use-case';

describe('BuscarCampanhaPublicaUseCase', () => {
  function criarCampanha(
    overrides: Partial<{
      grupoId: string | null;
      removidaEm: Date | null;
      status: Campanha['status'];
      cotaVencedoraNumero: number | null;
      vencedorNome: string | null;
      vencedorTelefone: string | null;
    }> = {},
  ): Campanha {
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
      overrides.status ?? 'LIBERADA',
      'VENDAS_ABERTAS',
      overrides.cotaVencedoraNumero ?? null,
      null,
      overrides.removidaEm ?? null,
      1,
      10,
      2,
      true,
      true,
      true,
      false,
      'https://exemplo.com/foto.png',
      overrides.vencedorNome ?? null,
      overrides.vencedorTelefone ?? null,
      false,
      false,
      false,
      'CPF',
      '12345678900',
    );
  }

  function criarDependencias(campanha: Campanha | null, linkWhatsapp: string | null = 'https://chat.whatsapp.com/ABC123') {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(new Grupo('grupo-1', 'admin-1', 'Grupo', '11999998888', new Date(), linkWhatsapp)),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    return { campanhaRepository, grupoRepository };
  }

  it('retorna só os campos públicos da campanha, sem dados sensíveis', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository, grupoRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

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
      reservaExigeCpf: false,
      linkGrupoWhatsapp: 'https://chat.whatsapp.com/ABC123',
      cotaVencedoraNumero: null,
      vencedorNome: null,
      vencedorTelefone: null,
    });
    expect(resultado).not.toHaveProperty('chavePix');
    expect(resultado).not.toHaveProperty('tipoChavePix');
    expect(resultado).not.toHaveProperty('administradorId');
  });

  it('inclui os dados do vencedor quando a campanha está finalizada', async () => {
    const campanha = criarCampanha({
      status: 'FINALIZADA',
      cotaVencedoraNumero: 42,
      vencedorNome: 'Maria Silva',
      vencedorTelefone: '11999999999',
    });
    const { campanhaRepository, grupoRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

    const resultado = await useCase.executar({ campanhaId: 'campanha-1' });

    expect(resultado.cotaVencedoraNumero).toBe(42);
    expect(resultado.vencedorNome).toBe('Maria Silva');
    expect(resultado.vencedorTelefone).toBe('11999999999');
  });

  it('não inclui dados do vencedor quando a campanha ainda não está finalizada, mesmo se já preenchidos', async () => {
    const campanha = criarCampanha({
      status: 'LIBERADA_PARA_SORTEIO',
      cotaVencedoraNumero: 42,
      vencedorNome: 'Maria Silva',
      vencedorTelefone: '11999999999',
    });
    const { campanhaRepository, grupoRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

    const resultado = await useCase.executar({ campanhaId: 'campanha-1' });

    expect(resultado.cotaVencedoraNumero).toBeNull();
    expect(resultado.vencedorNome).toBeNull();
    expect(resultado.vencedorTelefone).toBeNull();
  });

  it('devolve linkGrupoWhatsapp nulo quando o grupo não tem link cadastrado', async () => {
    const { campanhaRepository, grupoRepository } = criarDependencias(criarCampanha(), null);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

    const resultado = await useCase.executar({ campanhaId: 'campanha-1' });

    expect(resultado.linkGrupoWhatsapp).toBeNull();
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository, grupoRepository } = criarDependencias(null);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

    await expect(useCase.executar({ campanhaId: 'inexistente' })).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha ainda não foi lançada para um grupo', async () => {
    const campanha = criarCampanha({ grupoId: null });
    const { campanhaRepository, grupoRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

    await expect(useCase.executar({ campanhaId: 'campanha-1' })).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha foi removida', async () => {
    const campanha = criarCampanha({ removidaEm: new Date('2026-01-01T00:00:00Z') });
    const { campanhaRepository, grupoRepository } = criarDependencias(campanha);
    const useCase = new BuscarCampanhaPublicaUseCase(campanhaRepository, grupoRepository);

    await expect(useCase.executar({ campanhaId: 'campanha-1' })).rejects.toThrow('Campanha não encontrada.');
  });
});

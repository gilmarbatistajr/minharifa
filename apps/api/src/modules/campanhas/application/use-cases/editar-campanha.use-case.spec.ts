import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { Premio } from '../../../premios/domain/entities/premio.entity';
import { PremioRepository } from '../../../premios/domain/repositories/premio.repository';
import { EditarCampanhaUseCase } from './editar-campanha.use-case';

describe('EditarCampanhaUseCase', () => {
  const premio = new Premio('premio-1', 'admin-1', 'iPhone 16 Pro', 'desc', 'foto.png', 8000, null, new Date());

  function criarCampanha(status: Campanha['status'] = 'NOVO', administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      null,
      'Campanha de Natal',
      'Descrição original',
      ['premio-1'],
      null,
      null,
      null,
      10,
      50,
      'ESCOLHA_NUMERO',
      status,
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );
  }

  const inputBase = {
    administradorId: 'admin-1',
    campanhaId: 'campanha-1',
    nome: 'Campanha de Natal (editada)',
    descricao: 'Descrição editada',
    telefoneSuporte: '5511999998888',
    premioIds: ['premio-1'],
    quantidadeCotas: 20,
    valorCota: 75,
    formaVenda: 'LOTE_FECHADO' as const,
  };

  function criarDependencias(campanha: Campanha | null, premioRetornado: Premio | null = premio) {
    const premioRepository: PremioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(premioRetornado),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { premioRepository, campanhaRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new EditarCampanhaUseCase(deps.premioRepository, deps.campanhaRepository);
  }

  it('edita todos os dados de uma campanha nova', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await useCase.executar(inputBase);

    expect(campanha.nome).toBe('Campanha de Natal (editada)');
    expect(campanha.descricao).toBe('Descrição editada');
    expect(campanha.quantidadeCotas).toBe(20);
    expect(campanha.valorCota).toBe(75);
    expect(campanha.formaVenda).toBe('LOTE_FECHADO');
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('aplica os valores padrão de compra, expiração e dados obrigatórios quando não informados', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await useCase.executar(inputBase);

    expect(campanha.quantidadeMinimaPorCompra).toBe(1);
    expect(campanha.quantidadeMaximaPorCompra).toBeNull();
    expect(campanha.expiracaoReservaMinutos).toBe(5);
    expect(campanha.reservaExigeEmail).toBe(true);
    expect(campanha.reservaExigeConfirmacaoTelefone).toBe(false);
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('NOVO', 'admin-2');
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha não está mais em status novo', async () => {
    const campanha = criarCampanha('AGUARDANDO_LIBERACAO');
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Somente campanhas novas podem ser editadas.');
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando nenhum prêmio é selecionado', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, premioIds: [] })).rejects.toThrow(
      'Selecione ao menos um prêmio',
    );
  });

  it('rejeita quando um prêmio selecionado não existe ou não pertence ao administrador', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha, null);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow(
      'Um dos prêmios selecionados não foi encontrado.',
    );
  });

  it('rejeita quantidade de cotas inválida', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, quantidadeCotas: 0 })).rejects.toThrow(
      'quantidade de cotas deve ser maior que zero',
    );
  });

  it('rejeita valor de cota inválido', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, valorCota: -1 })).rejects.toThrow(
      'valor da cota deve ser maior que zero',
    );
  });

  it('rejeita telefone de suporte vazio', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, telefoneSuporte: '  ' })).rejects.toThrow(
      'Informe o telefone de suporte',
    );
  });

  it('rejeita quantidade máxima por compra menor que a mínima', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ ...inputBase, quantidadeMinimaPorCompra: 5, quantidadeMaximaPorCompra: 2 }),
    ).rejects.toThrow('quantidade máxima por compra não pode ser menor que a mínima');
  });

  it('rejeita opção de expiração da reserva fora da lista permitida', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, expiracaoReservaMinutos: 3 })).rejects.toThrow(
      'Opção de expiração da reserva inválida',
    );
  });
});

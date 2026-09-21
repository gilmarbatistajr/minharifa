import { Premio } from '../../../premios/domain/entities/premio.entity';
import { PremioRepository } from '../../../premios/domain/repositories/premio.repository';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { CriarCampanhaUseCase } from './criar-campanha.use-case';

describe('CriarCampanhaUseCase', () => {
  const premio = new Premio('premio-1', 'admin-1', 'iPhone 16 Pro', 'desc', 'foto.png', 8000, null, new Date());

  const inputBase = {
    administradorId: 'admin-1',
    nome: 'Campanha de Natal',
    descricao: 'Campanha especial de fim de ano',
    telefoneSuporte: '5511999998888',
    premioIds: ['premio-1'],
    quantidadeCotas: 10,
    valorCota: 50,
    formaVenda: 'ESCOLHA_NUMERO' as const,
  };

  function criarDependencias(premioRetornado: Premio | null = premio) {
    const premioRepository: PremioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(premioRetornado),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };

    return { premioRepository, campanhaRepository };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new CriarCampanhaUseCase(deps.premioRepository, deps.campanhaRepository);
  }

  it('cria a campanha como NOVA, sem grupo nem datas, sem materializar cotas', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.campanhaId).toBeDefined();
    expect(deps.campanhaRepository.criar).toHaveBeenCalledTimes(1);
    const campanhaCriada = (deps.campanhaRepository.criar as jest.Mock).mock.calls[0][0];
    expect(campanhaCriada.premioIds).toEqual(['premio-1']);
    expect(campanhaCriada.status).toBe('NOVO');
    expect(campanhaCriada.grupoId).toBeNull();
    expect(campanhaCriada.dataAberturaVendas).toBeNull();
    expect(campanhaCriada.dataEncerramentoVendas).toBeNull();
    expect(campanhaCriada.dataRealizacao).toBeNull();
  });

  it('aceita múltiplos prêmios selecionados', async () => {
    const premio2 = new Premio('premio-2', 'admin-1', 'AirPods', 'desc', 'foto2.png', 1500, null, new Date());
    const deps = criarDependencias();
    (deps.premioRepository.buscarPorId as jest.Mock).mockImplementation(async (id: string) =>
      id === 'premio-1' ? premio : id === 'premio-2' ? premio2 : null,
    );
    const useCase = montarUseCase(deps);

    await useCase.executar({ ...inputBase, premioIds: ['premio-1', 'premio-2'] });

    const campanhaCriada = (deps.campanhaRepository.criar as jest.Mock).mock.calls[0][0];
    expect(campanhaCriada.premioIds).toEqual(['premio-1', 'premio-2']);
  });

  it('rejeita quando nenhum prêmio é selecionado', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, premioIds: [] })).rejects.toThrow(
      'Selecione ao menos um prêmio',
    );
  });

  it('rejeita quando um prêmio selecionado não existe ou não pertence ao administrador', async () => {
    const deps = criarDependencias(null);
    const useCase = montarUseCase(deps);

    await expect(useCase.executar(inputBase)).rejects.toThrow(
      'Um dos prêmios selecionados não foi encontrado.',
    );
  });

  it('rejeita quantidade de cotas inválida', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, quantidadeCotas: 0 })).rejects.toThrow(
      'quantidade de cotas deve ser maior que zero',
    );
  });

  it('rejeita valor de cota inválido', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, valorCota: -1 })).rejects.toThrow(
      'valor da cota deve ser maior que zero',
    );
  });

  it('rejeita telefone de suporte vazio', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, telefoneSuporte: '  ' })).rejects.toThrow(
      'Informe o telefone de suporte',
    );
  });

  it('aplica os valores padrão de compra, expiração e dados obrigatórios quando não informados', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await useCase.executar(inputBase);

    const campanhaCriada = (deps.campanhaRepository.criar as jest.Mock).mock.calls[0][0];
    expect(campanhaCriada.telefoneSuporte).toBe('5511999998888');
    expect(campanhaCriada.quantidadeMinimaPorCompra).toBe(1);
    expect(campanhaCriada.quantidadeMaximaPorCompra).toBeNull();
    expect(campanhaCriada.expiracaoReservaMinutos).toBe(5);
    expect(campanhaCriada.reservaExigeEmail).toBe(true);
    expect(campanhaCriada.reservaExigeNome).toBe(true);
    expect(campanhaCriada.reservaExigeTelefone).toBe(true);
    expect(campanhaCriada.reservaExigeConfirmacaoTelefone).toBe(false);
  });

  it('aceita configurações customizadas de compra, expiração e dados obrigatórios', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await useCase.executar({
      ...inputBase,
      quantidadeMinimaPorCompra: 2,
      quantidadeMaximaPorCompra: 10,
      expiracaoReservaMinutos: null,
      reservaExigeEmail: false,
      reservaExigeConfirmacaoTelefone: true,
    });

    const campanhaCriada = (deps.campanhaRepository.criar as jest.Mock).mock.calls[0][0];
    expect(campanhaCriada.quantidadeMinimaPorCompra).toBe(2);
    expect(campanhaCriada.quantidadeMaximaPorCompra).toBe(10);
    expect(campanhaCriada.expiracaoReservaMinutos).toBeNull();
    expect(campanhaCriada.reservaExigeEmail).toBe(false);
    expect(campanhaCriada.reservaExigeConfirmacaoTelefone).toBe(true);
  });

  it('rejeita quantidade máxima por compra menor que a mínima', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ ...inputBase, quantidadeMinimaPorCompra: 5, quantidadeMaximaPorCompra: 2 }),
    ).rejects.toThrow('quantidade máxima por compra não pode ser menor que a mínima');
  });

  it('rejeita opção de expiração da reserva fora da lista permitida', async () => {
    const deps = criarDependencias();
    const useCase = montarUseCase(deps);

    await expect(useCase.executar({ ...inputBase, expiracaoReservaMinutos: 3 })).rejects.toThrow(
      'Opção de expiração da reserva inválida',
    );
  });
});

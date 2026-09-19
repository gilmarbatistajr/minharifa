import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { Campanha, FormaVendaCotas } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { ReservarLoteCotasUseCase } from './reservar-lote-cotas.use-case';

describe('ReservarLoteCotasUseCase', () => {
  function criarCotas(quantidade: number): Cota[] {
    return Array.from(
      { length: quantidade },
      (_, indice) => new Cota(`cota-${indice + 1}`, 'campanha-1', indice + 1, 'DISPONIVEL', null, null, null),
    );
  }

  function criarCampanha(formaVenda: FormaVendaCotas): Campanha {
    return new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de teste',
      'Descrição de teste',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      formaVenda,
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarRepositorios(cotas: Cota[], formaVenda: FormaVendaCotas = 'ESCOLHA_NUMERO') {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(criarCampanha(formaVenda)),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    return { cotaRepository, campanhaRepository };
  }

  const agora = new Date('2026-01-01T10:00:00Z');

  it('reserva os números escolhidos manualmente em uma campanha de escolha manual', async () => {
    const cotas = criarCotas(10);
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', compradorId: 'comprador-maria', numeros: [3, 1, 7] },
      agora,
    );

    expect(resultado.numeros).toEqual([1, 3, 7]);
    expect(resultado.reservaExpiraEm).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(cotas.find((c) => c.numero === 1)?.status).toBe('RESERVADA');
    expect(cotas.find((c) => c.numero === 3)?.status).toBe('RESERVADA');
    expect(cotas.find((c) => c.numero === 7)?.status).toBe('RESERVADA');
    expect(cotas.find((c) => c.numero === 2)?.status).toBe('DISPONIVEL');
    expect(cotaRepository.salvar).toHaveBeenCalledTimes(3);
  });

  it('reserva uma quantidade aleatória dentro das cotas disponíveis em uma campanha de lote fechado', async () => {
    const cotas = criarCotas(10);
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'LOTE_FECHADO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', compradorId: 'comprador-maria', quantidadeAleatoria: 4 },
      agora,
    );

    expect(resultado.numeros).toHaveLength(4);
    expect(new Set(resultado.numeros).size).toBe(4);
    resultado.numeros.forEach((numero) => expect(numero).toBeGreaterThanOrEqual(1));
    const reservadas = cotas.filter((c) => c.status === 'RESERVADA');
    expect(reservadas).toHaveLength(4);
  });

  it('não escolhe cotas já reservadas ou pagas no lote aleatório', async () => {
    const cotas = criarCotas(3);
    cotas[0].status = 'PAGA';
    cotas[1].status = 'RESERVADA';
    cotas[1].reservaExpiraEm = new Date('2026-06-01T00:00:00Z');
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'LOTE_FECHADO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', compradorId: 'comprador-maria', quantidadeAleatoria: 1 },
      agora,
    );

    expect(resultado.numeros).toEqual([3]);
  });

  it('rejeita quantidade aleatória maior que as cotas disponíveis', async () => {
    const cotas = criarCotas(2);
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'LOTE_FECHADO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', compradorId: 'comprador-maria', quantidadeAleatoria: 5 },
        agora,
      ),
    ).rejects.toThrow('Restam apenas 2 cota(s) disponível(is).');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando um número escolhido manualmente não existe', async () => {
    const cotas = criarCotas(3);
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', compradorId: 'comprador-maria', numeros: [99] }, agora),
    ).rejects.toThrow('Cota 99 não existe nessa campanha.');
  });

  it('rejeita quando um número escolhido manualmente já está reservado por outra pessoa', async () => {
    const cotas = criarCotas(3);
    cotas[0].status = 'RESERVADA';
    cotas[0].compradorId = 'comprador-joao';
    cotas[0].reservaExpiraEm = new Date('2026-06-01T00:00:00Z');
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', compradorId: 'comprador-maria', numeros: [1] }, agora),
    ).rejects.toThrow('não está disponível para reserva');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('não persiste nenhuma reserva se um dos números do lote manual falhar (atomicidade)', async () => {
    const cotas = criarCotas(3);
    cotas[2].status = 'PAGA';
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', compradorId: 'comprador-maria', numeros: [1, 2, 3] }, agora),
    ).rejects.toThrow();

    expect(cotas[0].status).toBe('DISPONIVEL');
    expect(cotas[1].status).toBe('DISPONIVEL');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando nem números nem quantidade aleatória são informados', async () => {
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Informe os números desejados ou a quantidade para escolha aleatória.');
  });

  it('rejeita quando números e quantidade aleatória são informados ao mesmo tempo', async () => {
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', compradorId: 'comprador-maria', numeros: [1], quantidadeAleatoria: 2 },
        agora,
      ),
    ).rejects.toThrow('Escolha apenas uma forma de seleção');
  });

  it('rejeita quando a campanha não existe', async () => {
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), 'ESCOLHA_NUMERO');
    (campanhaRepository.buscarPorId as jest.Mock).mockResolvedValue(null);
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'inexistente', compradorId: 'comprador-maria', numeros: [1] }, agora),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita escolha manual de números em uma campanha de lote fechado', async () => {
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(10), 'LOTE_FECHADO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', compradorId: 'comprador-maria', numeros: [1, 2] }, agora),
    ).rejects.toThrow('só permite compra em lotes fechados');
  });

  it('rejeita compra em lote aleatório em uma campanha de escolha manual', async () => {
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(10), 'ESCOLHA_NUMERO');
    const useCase = new ReservarLoteCotasUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', compradorId: 'comprador-maria', quantidadeAleatoria: 5 },
        agora,
      ),
    ).rejects.toThrow('só permite escolha manual de números');
  });
});

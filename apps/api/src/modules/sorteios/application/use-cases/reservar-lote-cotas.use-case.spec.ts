import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { ReservarLoteCotasUseCase } from './reservar-lote-cotas.use-case';

describe('ReservarLoteCotasUseCase', () => {
  function criarCotas(quantidade: number): Cota[] {
    return Array.from(
      { length: quantidade },
      (_, indice) => new Cota(`cota-${indice + 1}`, 'sorteio-1', indice + 1, 'DISPONIVEL', null, null, null),
    );
  }

  function criarRepositorio(cotas: Cota[]): CotaRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn().mockResolvedValue(cotas),
      contarPagasPorSorteio: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
  }

  const agora = new Date('2026-01-01T10:00:00Z');

  it('reserva os números escolhidos manualmente', async () => {
    const cotas = criarCotas(10);
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', compradorId: 'comprador-maria', numeros: [3, 1, 7] },
      agora,
    );

    expect(resultado.numeros).toEqual([1, 3, 7]);
    expect(resultado.reservaExpiraEm).toEqual(new Date('2026-01-01T10:02:00Z'));
    expect(cotas.find((c) => c.numero === 1)?.status).toBe('RESERVADA');
    expect(cotas.find((c) => c.numero === 3)?.status).toBe('RESERVADA');
    expect(cotas.find((c) => c.numero === 7)?.status).toBe('RESERVADA');
    expect(cotas.find((c) => c.numero === 2)?.status).toBe('DISPONIVEL');
    expect(repositorio.salvar).toHaveBeenCalledTimes(3);
  });

  it('reserva uma quantidade aleatória dentro das cotas disponíveis', async () => {
    const cotas = criarCotas(10);
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', compradorId: 'comprador-maria', quantidadeAleatoria: 4 },
      agora,
    );

    expect(resultado.numeros).toHaveLength(4);
    expect(new Set(resultado.numeros).size).toBe(4);
    resultado.numeros.forEach((numero) => expect(numero).toBeGreaterThanOrEqual(1));
    const reservadas = cotas.filter((c) => c.status === 'RESERVADA');
    expect(reservadas).toHaveLength(4);
  });

  it('não escolhe cotas já reservadas ou pagas no sorteio aleatório', async () => {
    const cotas = criarCotas(3);
    cotas[0].status = 'PAGA';
    cotas[1].status = 'RESERVADA';
    cotas[1].reservaExpiraEm = new Date('2026-06-01T00:00:00Z');
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', compradorId: 'comprador-maria', quantidadeAleatoria: 1 },
      agora,
    );

    expect(resultado.numeros).toEqual([3]);
  });

  it('rejeita quantidade aleatória maior que as cotas disponíveis', async () => {
    const cotas = criarCotas(2);
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', compradorId: 'comprador-maria', quantidadeAleatoria: 5 },
        agora,
      ),
    ).rejects.toThrow('Restam apenas 2 cota(s) disponível(is).');
    expect(repositorio.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando um número escolhido manualmente não existe', async () => {
    const cotas = criarCotas(3);
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', compradorId: 'comprador-maria', numeros: [99] }, agora),
    ).rejects.toThrow('Cota 99 não existe nesse sorteio.');
  });

  it('rejeita quando um número escolhido manualmente já está reservado por outra pessoa', async () => {
    const cotas = criarCotas(3);
    cotas[0].status = 'RESERVADA';
    cotas[0].compradorId = 'comprador-joao';
    cotas[0].reservaExpiraEm = new Date('2026-06-01T00:00:00Z');
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', compradorId: 'comprador-maria', numeros: [1] }, agora),
    ).rejects.toThrow('não está disponível para reserva');
    expect(repositorio.salvar).not.toHaveBeenCalled();
  });

  it('não persiste nenhuma reserva se um dos números do lote manual falhar (atomicidade)', async () => {
    const cotas = criarCotas(3);
    cotas[2].status = 'PAGA';
    const repositorio = criarRepositorio(cotas);
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', compradorId: 'comprador-maria', numeros: [1, 2, 3] }, agora),
    ).rejects.toThrow();

    expect(cotas[0].status).toBe('DISPONIVEL');
    expect(cotas[1].status).toBe('DISPONIVEL');
    expect(repositorio.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando nem números nem quantidade aleatória são informados', async () => {
    const repositorio = criarRepositorio(criarCotas(3));
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', compradorId: 'comprador-maria' }, agora),
    ).rejects.toThrow('Informe os números desejados ou a quantidade para escolha aleatória.');
  });

  it('rejeita quando números e quantidade aleatória são informados ao mesmo tempo', async () => {
    const repositorio = criarRepositorio(criarCotas(3));
    const useCase = new ReservarLoteCotasUseCase(repositorio);

    await expect(
      useCase.executar(
        { sorteioId: 'sorteio-1', compradorId: 'comprador-maria', numeros: [1], quantidadeAleatoria: 2 },
        agora,
      ),
    ).rejects.toThrow('Escolha apenas uma forma de seleção');
  });
});

import { Cota } from '../../domain/entities/cota.entity';
import { CotaRepository } from '../../domain/repositories/cota.repository';
import { Campanha, FormaVendaCotas } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { ReservarLoteCotasConvidadoUseCase } from './reservar-lote-cotas-convidado.use-case';

describe('ReservarLoteCotasConvidadoUseCase', () => {
  function criarCotas(quantidade: number): Cota[] {
    return Array.from(
      { length: quantidade },
      (_, indice) => new Cota(`cota-${indice + 1}`, 'campanha-1', indice + 1, 'DISPONIVEL', null, null, null),
    );
  }

  function criarCampanha(formaVenda: FormaVendaCotas = 'ESCOLHA_NUMERO'): Campanha {
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
      null,
      '',
      1,
      null,
      2,
    );
  }

  function criarRepositorios(cotas: Cota[], campanha: Campanha) {
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      listarReservadasPorComprador: jest.fn(),
      listarReservadasPorTokenConvidado: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    return { cotaRepository, campanhaRepository };
  }

  const agora = new Date('2026-01-01T10:00:00Z');

  it('reserva as cotas escolhidas e guarda o contato do convidado direto nelas, sem compradorId', async () => {
    const cotas = criarCotas(10);
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    const resultado = await useCase.executar(
      {
        campanhaId: 'campanha-1',
        numeros: [1, 3],
        nome: 'Maria Convidada',
        email: 'maria@exemplo.com',
        telefone: '11988887777',
      },
      agora,
    );

    expect(resultado.numeros).toEqual([1, 3]);
    expect(resultado.tokenReservaConvidado).toBeTruthy();

    const cota1 = cotas.find((c) => c.numero === 1)!;
    expect(cota1.status).toBe('RESERVADA');
    expect(cota1.compradorId).toBeNull();
    expect(cota1.tokenReservaConvidado).toBe(resultado.tokenReservaConvidado);
    expect(cota1.convidadoNome).toBe('Maria Convidada');
    expect(cota1.convidadoEmail).toBe('maria@exemplo.com');
    expect(cota1.convidadoTelefone).toBe('11988887777');
  });

  it('rejeita quando a campanha exige nome e ele não foi informado', async () => {
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeros: [1], email: 'a@a.com', telefone: '11988887777' },
        agora,
      ),
    ).rejects.toThrow('Informe seu nome para reservar.');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita quando a campanha exige e-mail e ele não foi informado', async () => {
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', telefone: '11988887777' },
        agora,
      ),
    ).rejects.toThrow('Informe seu e-mail para reservar.');
  });

  it('rejeita e-mail em formato inválido', async () => {
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', email: 'não-é-email', telefone: '11988887777' },
        agora,
      ),
    ).rejects.toThrow('Informe um e-mail válido.');
  });

  it('rejeita quando a campanha exige telefone e ele não foi informado', async () => {
    const campanha = criarCampanha();
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', email: 'a@a.com' }, agora),
    ).rejects.toThrow('Informe seu telefone para reservar.');
  });

  it('não exige um campo quando a campanha está configurada para não pedi-lo', async () => {
    const campanha = criarCampanha();
    campanha.reservaExigeEmail = false;
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', telefone: '11988887777' },
      agora,
    );

    expect(resultado.numeros).toEqual([1]);
  });

  it('rejeita quando a campanha exige confirmação de telefone e ela não confere', async () => {
    const campanha = criarCampanha();
    campanha.reservaExigeConfirmacaoTelefone = true;
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        {
          campanhaId: 'campanha-1',
          numeros: [1],
          nome: 'Maria',
          email: 'a@a.com',
          telefone: '11988887777',
          confirmacaoTelefone: '11900000000',
        },
        agora,
      ),
    ).rejects.toThrow('A confirmação de telefone não confere com o telefone informado.');
  });

  it('aceita quando a confirmação de telefone confere', async () => {
    const campanha = criarCampanha();
    campanha.reservaExigeConfirmacaoTelefone = true;
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    const resultado = await useCase.executar(
      {
        campanhaId: 'campanha-1',
        numeros: [1],
        nome: 'Maria',
        email: 'a@a.com',
        telefone: '11988887777',
        confirmacaoTelefone: '11988887777',
      },
      agora,
    );

    expect(resultado.numeros).toEqual([1]);
  });

  it('rejeita quando a campanha exige CPF e ele não foi informado', async () => {
    const campanha = criarCampanha();
    campanha.reservaExigeCpf = true;
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', email: 'a@a.com', telefone: '11988887777' },
        agora,
      ),
    ).rejects.toThrow('Informe seu CPF para reservar.');
    expect(cotaRepository.salvar).not.toHaveBeenCalled();
  });

  it('rejeita CPF com dígitos verificadores inválidos', async () => {
    const campanha = criarCampanha();
    campanha.reservaExigeCpf = true;
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', email: 'a@a.com', telefone: '11988887777', cpf: '111.111.111-11' },
        agora,
      ),
    ).rejects.toThrow('Informe um CPF válido.');
  });

  it('guarda o CPF válido (só dígitos) na cota quando a campanha exige', async () => {
    const cotas = criarCotas(3);
    const campanha = criarCampanha();
    campanha.reservaExigeCpf = true;
    const { cotaRepository, campanhaRepository } = criarRepositorios(cotas, campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await useCase.executar(
      { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', email: 'a@a.com', telefone: '11988887777', cpf: '529.982.247-25' },
      agora,
    );

    expect(cotas[0].convidadoCpf).toBe('52998224725');
  });

  it('rejeita quando a campanha não existe', async () => {
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), criarCampanha());
    (campanhaRepository.buscarPorId as jest.Mock).mockResolvedValue(null);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'inexistente', numeros: [1], nome: 'Maria', email: 'a@a.com', telefone: '11988887777' },
        agora,
      ),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha ainda não foi lançada para um grupo (sem Link de Vendas público)', async () => {
    const campanha = criarCampanha();
    campanha.grupoId = null;
    const { cotaRepository, campanhaRepository } = criarRepositorios(criarCotas(3), campanha);
    const useCase = new ReservarLoteCotasConvidadoUseCase(cotaRepository, campanhaRepository);

    await expect(
      useCase.executar(
        { campanhaId: 'campanha-1', numeros: [1], nome: 'Maria', email: 'a@a.com', telefone: '11988887777' },
        agora,
      ),
    ).rejects.toThrow('Campanha não encontrada.');
  });
});

import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { Cota } from '../../../campanhas/domain/entities/cota.entity';
import { CotaRepository } from '../../../campanhas/domain/repositories/cota.repository';
import { Grupo } from '../../../grupos/domain/entities/grupo.entity';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { EscolhaPosCancelamentoRepository } from '../../domain/repositories/escolha-pos-cancelamento.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { IniciarCancelamentoCampanhaUseCase } from './iniciar-cancelamento-campanha.use-case';

describe('IniciarCancelamentoCampanhaUseCase', () => {
  function criarCampanha(): Campanha {
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
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'VENDAS_ABERTAS',
      null,
      null,
    );
  }

  function criarComprador(id: string): Comprador {
    return new Comprador(
      id,
      'grupo-1',
      'Maria Silva',
      null,
      new Date('1990-05-10'),
      '11912345678',
      '12345678909',
      'Rua das Flores, 123',
      'maria@example.com',
      'hash',
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

  function criarDependencias(campanha: Campanha | null, grupo: Grupo | null, cotas: Cota[]) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const cotaRepository: CotaRepository = {
      buscarPorId: jest.fn(),
      buscarPorCampanhaENumero: jest.fn(),
      listarPorCampanha: jest.fn().mockResolvedValue(cotas),
      contarPagasPorCampanha: jest.fn(),
      contarPagasAgrupadoPorComprador: jest.fn(),
      contarPagasAgrupadoPorCompradorDoAdministrador: jest.fn(),
      listarReservadasPorComprador: jest.fn(),
      criarEmLote: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const compradorRepository: CompradorRepository = {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => criarComprador(id)),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
    };
    const escolhaPosCancelamentoRepository: EscolhaPosCancelamentoRepository = {
      buscarPorId: jest.fn(),
      listarPendentesExpiradas: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };
    const notificationSender: NotificationSender = {
      enviarEmail: jest.fn().mockResolvedValue(undefined),
      enviarWhatsapp: jest.fn().mockResolvedValue(undefined),
    };

    return {
      campanhaRepository,
      grupoRepository,
      cotaRepository,
      compradorRepository,
      escolhaPosCancelamentoRepository,
      notificationSender,
    };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new IniciarCancelamentoCampanhaUseCase(
      deps.campanhaRepository,
      deps.grupoRepository,
      deps.cotaRepository,
      deps.compradorRepository,
      deps.escolhaPosCancelamentoRepository,
      deps.notificationSender,
    );
  }

  const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

  it('cancela a campanha, libera cotas reservadas e cria escolhas para quem já pagou', async () => {
    const campanha = criarCampanha();
    const cotas = [
      new Cota('cota-1', 'campanha-1', 1, 'RESERVADA', 'comprador-joao', new Date(), new Date()),
      new Cota('cota-2', 'campanha-1', 2, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-3', 'campanha-1', 3, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-4', 'campanha-1', 4, 'DISPONIVEL', null, null, null),
    ];
    const deps = criarDependencias(campanha, grupo, cotas);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(
      { campanhaId: 'campanha-1', administradorId: 'admin-1' },
      new Date('2026-01-01T00:00:00Z'),
    );

    expect(campanha.statusVendas).toBe('CANCELADO');
    expect(resultado.cotasLiberadas).toBe(1);
    expect(resultado.escolhasGeradas).toBe(1);
    expect(deps.escolhaPosCancelamentoRepository.criar).toHaveBeenCalledTimes(1);
    const escolhaCriada = (deps.escolhaPosCancelamentoRepository.criar as jest.Mock).mock.calls[0][0];
    expect(escolhaCriada.compradorId).toBe('comprador-maria');
    expect(escolhaCriada.quantidadeCotas).toBe(2);
    expect(escolhaCriada.valorTotal).toBe(100);
    expect(deps.notificationSender.enviarEmail).toHaveBeenCalledTimes(1);
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null, null, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'inexistente', administradorId: 'admin-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha();
    const outroGrupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(campanha, outroGrupo, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', administradorId: 'admin-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita cancelar uma campanha já finalizada', async () => {
    const campanha = criarCampanha();
    campanha.statusVendas = 'FINALIZADO';
    const deps = criarDependencias(campanha, grupo, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ campanhaId: 'campanha-1', administradorId: 'admin-1' }),
    ).rejects.toThrow('não pode ser cancelada');
  });
});

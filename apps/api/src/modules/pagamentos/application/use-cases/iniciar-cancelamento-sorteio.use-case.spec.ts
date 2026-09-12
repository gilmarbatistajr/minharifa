import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { Cota } from '../../../sorteios/domain/entities/cota.entity';
import { CotaRepository } from '../../../sorteios/domain/repositories/cota.repository';
import { Grupo } from '../../../grupos/domain/entities/grupo.entity';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { Comprador } from '../../../compradores/domain/entities/comprador.entity';
import { CompradorRepository } from '../../../compradores/domain/repositories/comprador.repository';
import { EscolhaPosCancelamentoRepository } from '../../domain/repositories/escolha-pos-cancelamento.repository';
import { NotificationSender } from '../../../../shared/domain/notification-sender';
import { IniciarCancelamentoSorteioUseCase } from './iniciar-cancelamento-sorteio.use-case';

describe('IniciarCancelamentoSorteioUseCase', () => {
  function criarSorteio(): Sorteio {
    const sorteio = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'premio-1',
      new Date(),
      new Date(),
      new Date(),
      100,
        50,
      'VENDAS_ABERTAS',
      null,
      null,
    );
    return sorteio;
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

  function criarDependencias(sorteio: Sorteio | null, grupo: Grupo | null, cotas: Cota[]) {
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(sorteio),
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
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
      buscarPorSorteioENumero: jest.fn(),
      listarPorSorteio: jest.fn().mockResolvedValue(cotas),
      contarPagasPorSorteio: jest.fn(),
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
    const notificationSender: NotificationSender = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

    return {
      sorteioRepository,
      grupoRepository,
      cotaRepository,
      compradorRepository,
      escolhaPosCancelamentoRepository,
      notificationSender,
    };
  }

  function montarUseCase(deps: ReturnType<typeof criarDependencias>) {
    return new IniciarCancelamentoSorteioUseCase(
      deps.sorteioRepository,
      deps.grupoRepository,
      deps.cotaRepository,
      deps.compradorRepository,
      deps.escolhaPosCancelamentoRepository,
      deps.notificationSender,
    );
  }

  const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

  it('cancela o sorteio, libera cotas reservadas e cria escolhas para quem já pagou', async () => {
    const sorteio = criarSorteio();
    const cotas = [
      new Cota('cota-1', 'sorteio-1', 1, 'RESERVADA', 'comprador-joao', new Date(), new Date()),
      new Cota('cota-2', 'sorteio-1', 2, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-3', 'sorteio-1', 3, 'PAGA', 'comprador-maria', new Date(), null),
      new Cota('cota-4', 'sorteio-1', 4, 'DISPONIVEL', null, null, null),
    ];
    const deps = criarDependencias(sorteio, grupo, cotas);
    const useCase = montarUseCase(deps);

    const resultado = await useCase.executar(
      { sorteioId: 'sorteio-1', administradorId: 'admin-1' },
      new Date('2026-01-01T00:00:00Z'),
    );

    expect(sorteio.status).toBe('CANCELADO');
    expect(resultado.cotasLiberadas).toBe(1);
    expect(resultado.escolhasGeradas).toBe(1);
    expect(deps.escolhaPosCancelamentoRepository.criar).toHaveBeenCalledTimes(1);
    const escolhaCriada = (deps.escolhaPosCancelamentoRepository.criar as jest.Mock).mock.calls[0][0];
    expect(escolhaCriada.compradorId).toBe('comprador-maria');
    expect(escolhaCriada.quantidadeCotas).toBe(2);
    expect(escolhaCriada.valorTotal).toBe(100);
    expect(deps.notificationSender.enviarEmail).toHaveBeenCalledTimes(1);
  });

  it('rejeita quando o sorteio não existe', async () => {
    const deps = criarDependencias(null, null, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ sorteioId: 'inexistente', administradorId: 'admin-1' }),
    ).rejects.toThrow('Sorteio não encontrado.');
  });

  it('rejeita quando o sorteio pertence a outro administrador', async () => {
    const sorteio = criarSorteio();
    const outroGrupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(sorteio, outroGrupo, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', administradorId: 'admin-1' }),
    ).rejects.toThrow('Sorteio não encontrado.');
  });

  it('rejeita cancelar um sorteio já finalizado', async () => {
    const sorteio = criarSorteio();
    sorteio.status = 'FINALIZADO';
    const deps = criarDependencias(sorteio, grupo, []);
    const useCase = montarUseCase(deps);

    await expect(
      useCase.executar({ sorteioId: 'sorteio-1', administradorId: 'admin-1' }),
    ).rejects.toThrow('não pode ser cancelado');
  });
});

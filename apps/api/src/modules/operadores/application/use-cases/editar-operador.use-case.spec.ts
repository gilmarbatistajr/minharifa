import { Operador } from '../../domain/entities/operador.entity';
import { OperadorRepository } from '../../domain/repositories/operador.repository';
import { Grupo } from '../../../grupos/domain/entities/grupo.entity';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { EditarOperadorUseCase } from './editar-operador.use-case';

describe('EditarOperadorUseCase', () => {
  function criarOperador(): Operador {
    return new Operador(
      'operador-1',
      'admin-1',
      'Maria Souza',
      'Rua das Flores, 123',
      '52998224725',
      'MG-12.345.678',
      '31999998888',
      'maria.souza',
      'hash-atual',
      ['grupo-1'],
      new Date(),
    );
  }

  function criarRepositorioOperadorFake(operador: Operador | null, outros: Operador[] = []): OperadorRepository {
    return {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => (operador?.id === id ? operador : null)),
      buscarPorLogin: jest.fn().mockImplementation(async (login: string) =>
        outros.find((o) => o.login === login) ?? null,
      ),
      buscarPorCpf: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
      remover: jest.fn(),
    };
  }

  function criarRepositorioGrupoFake(grupos: Grupo[]): GrupoRepository {
    return {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => grupos.find((g) => g.id === id) ?? null),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
  }

  function criarPasswordHasherFake(): PasswordHasher {
    return {
      hash: jest.fn().mockResolvedValue('novo-hash'),
      comparar: jest.fn(),
    };
  }

  const grupoDoAdmin = new Grupo('grupo-1', 'admin-1', 'Grupo VIP', 'grupo-vip', new Date());
  const outroGrupoDoAdmin = new Grupo('grupo-2', 'admin-1', 'Grupo Premium', 'grupo-premium', new Date());

  it('atualiza campos cadastrais e a lista de grupos', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioOperadorFake(operador);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin, outroGrupoDoAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await useCase.executar({
      administradorId: 'admin-1',
      operadorId: 'operador-1',
      telefone: '31988887777',
      grupoIds: ['grupo-1', 'grupo-2'],
    });

    expect(operador.telefone).toBe('31988887777');
    expect(operador.grupoIds).toEqual(['grupo-1', 'grupo-2']);
    expect(operadorRepository.salvar).toHaveBeenCalledWith(operador);
  });

  it('atualiza as permissões do operador', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioOperadorFake(operador);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());
    const novasPermissoes = [
      { recurso: 'GRUPOS' as const, podeCriar: true, podeEditar: false, podeRemover: false },
    ];

    await useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1', permissoes: novasPermissoes });

    expect(operador.permissoes).toEqual(novasPermissoes);
  });

  it('troca a senha quando informada', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioOperadorFake(operador);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const passwordHasher = criarPasswordHasherFake();
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, passwordHasher);

    await useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1', senha: 'novaSenha123' });

    expect(passwordHasher.hash).toHaveBeenCalledWith('novaSenha123');
    expect(operador.senhaHash).toBe('novo-hash');
  });

  it('não altera a senha quando não informada', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioOperadorFake(operador);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1', endereco: 'Novo endereço' });

    expect(operador.senhaHash).toBe('hash-atual');
  });

  it('rejeita login já usado por outro operador', async () => {
    const operador = criarOperador();
    const outroOperador = new Operador(
      'operador-2',
      'admin-1',
      'Outro',
      'Endereço',
      '11144477735',
      'MG-2',
      '31900000000',
      'joao.silva',
      'hash',
      ['grupo-1'],
      new Date(),
    );
    const operadorRepository = criarRepositorioOperadorFake(operador, [outroOperador]);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1', login: 'joao.silva' }),
    ).rejects.toThrow('Este login já está em uso.');
  });

  it('permite manter o próprio login', async () => {
    const operador = criarOperador();
    const operadorRepository = criarRepositorioOperadorFake(operador);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1', login: 'maria.souza' });

    expect(operadorRepository.salvar).toHaveBeenCalled();
  });

  it('rejeita grupo que não pertence ao administrador', async () => {
    const operador = criarOperador();
    const grupoDeOutroAdmin = new Grupo('grupo-9', 'outro-admin', 'Grupo Alheio', 'grupo-alheio', new Date());
    const operadorRepository = criarRepositorioOperadorFake(operador);
    const grupoRepository = criarRepositorioGrupoFake([grupoDeOutroAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'operador-1', grupoIds: ['grupo-9'] }),
    ).rejects.toThrow('Um dos grupos selecionados não foi encontrado.');
  });

  it('lança erro se o operador não existir ou não pertencer ao administrador', async () => {
    const operadorRepository = criarRepositorioOperadorFake(null);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new EditarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(
      useCase.executar({ administradorId: 'admin-1', operadorId: 'inexistente' }),
    ).rejects.toThrow('Operador não encontrado.');
  });
});

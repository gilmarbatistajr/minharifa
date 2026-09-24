import { Operador } from '../../domain/entities/operador.entity';
import { OperadorRepository } from '../../domain/repositories/operador.repository';
import { Grupo } from '../../../grupos/domain/entities/grupo.entity';
import { GrupoRepository } from '../../../grupos/domain/repositories/grupo.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { CadastrarOperadorUseCase } from './cadastrar-operador.use-case';

const CPF_VALIDO = '52998224725';

describe('CadastrarOperadorUseCase', () => {
  function criarRepositorioOperadorFake(existentes: Operador[] = []): OperadorRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorLogin: jest.fn().mockImplementation(async (login: string) =>
        existentes.find((operador) => operador.login === login) ?? null,
      ),
      buscarPorCpf: jest.fn().mockImplementation(async (cpf: string) =>
        existentes.find((operador) => operador.cpf === cpf) ?? null,
      ),
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
      hash: jest.fn().mockResolvedValue('senha-hash'),
      comparar: jest.fn(),
    };
  }

  const grupoDoAdmin = new Grupo('grupo-1', 'admin-1', 'Grupo VIP', 'grupo-vip', new Date());

  const permissoesBase = [
    { recurso: 'CAMPANHAS' as const, podeCriar: true, podeEditar: false, podeRemover: false },
  ];

  const inputBase = {
    administradorId: 'admin-1',
    nomeCompleto: 'Maria Souza',
    endereco: 'Rua das Flores, 123',
    cpf: CPF_VALIDO,
    rg: 'MG-12.345.678',
    telefone: '31999998888',
    login: 'maria.souza',
    senha: 'senhaForte123',
    grupoIds: ['grupo-1'],
    permissoes: permissoesBase,
  };

  it('cadastra um operador válido associado a um grupo do administrador', async () => {
    const operadorRepository = criarRepositorioOperadorFake();
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const passwordHasher = criarPasswordHasherFake();
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, passwordHasher);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.operadorId).toBeDefined();
    expect(passwordHasher.hash).toHaveBeenCalledWith('senhaForte123');
    expect(operadorRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: CPF_VALIDO,
        senhaHash: 'senha-hash',
        grupoIds: ['grupo-1'],
        permissoes: permissoesBase,
      }),
    );
  });

  it('rejeita CPF inválido', async () => {
    const operadorRepository = criarRepositorioOperadorFake();
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(useCase.executar({ ...inputBase, cpf: '111.111.111-11' })).rejects.toThrow('CPF inválido.');
  });

  it('rejeita CPF já cadastrado', async () => {
    const operadorExistente = new Operador(
      'operador-existente',
      'admin-1',
      'Outro Nome',
      'Outro endereço',
      CPF_VALIDO,
      'MG-1',
      '31900000000',
      'outro.login',
      'hash',
      ['grupo-1'],
      new Date(),
    );
    const operadorRepository = criarRepositorioOperadorFake([operadorExistente]);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(useCase.executar(inputBase)).rejects.toThrow('Este CPF já está cadastrado.');
  });

  it('rejeita login já em uso', async () => {
    const operadorExistente = new Operador(
      'operador-existente',
      'admin-1',
      'Outro Nome',
      'Outro endereço',
      '11144477735',
      'MG-1',
      '31900000000',
      'maria.souza',
      'hash',
      ['grupo-1'],
      new Date(),
    );
    const operadorRepository = criarRepositorioOperadorFake([operadorExistente]);
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(useCase.executar(inputBase)).rejects.toThrow('Este login já está em uso.');
  });

  it('rejeita grupo que não pertence ao administrador', async () => {
    const grupoDeOutroAdmin = new Grupo('grupo-2', 'outro-admin', 'Grupo Alheio', 'grupo-alheio', new Date());
    const operadorRepository = criarRepositorioOperadorFake();
    const grupoRepository = criarRepositorioGrupoFake([grupoDeOutroAdmin]);
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(useCase.executar({ ...inputBase, grupoIds: ['grupo-2'] })).rejects.toThrow(
      'Um dos grupos selecionados não foi encontrado.',
    );
  });

  it('exige ao menos um grupo selecionado', async () => {
    const operadorRepository = criarRepositorioOperadorFake();
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(useCase.executar({ ...inputBase, grupoIds: [] })).rejects.toThrow(
      'Selecione ao menos um grupo para o operador.',
    );
  });

  it('exige senha com pelo menos 6 caracteres', async () => {
    const operadorRepository = criarRepositorioOperadorFake();
    const grupoRepository = criarRepositorioGrupoFake([grupoDoAdmin]);
    const useCase = new CadastrarOperadorUseCase(operadorRepository, grupoRepository, criarPasswordHasherFake());

    await expect(useCase.executar({ ...inputBase, senha: '123' })).rejects.toThrow(
      'A senha deve ter pelo menos 6 caracteres.',
    );
  });
});

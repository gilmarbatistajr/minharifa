import { Administrador, PermissaoRecurso } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { PasswordHasher } from '../../../../shared/domain/password-hasher';
import { CadastrarAdministradorMembroUseCase } from './cadastrar-administrador-membro.use-case';

const CPF_VALIDO = '52998224725';

describe('CadastrarAdministradorMembroUseCase', () => {
  function criarDono(): Administrador {
    return new Administrador(
      'dono-1',
      'Dono da Conta',
      'dono@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }

  function criarRepositorioFake(dono: Administrador | null, existentes: Administrador[] = []): AdministradorRepository {
    return {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => (dono?.id === id ? dono : null)),
      buscarPorEmail: jest.fn().mockImplementation(async (email: string) =>
        existentes.find((a) => a.email === email) ?? null,
      ),
      buscarPorCpf: jest.fn().mockImplementation(async (cpf: string) =>
        existentes.find((a) => a.cpf === cpf) ?? null,
      ),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      listarMembrosDaConta: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
      remover: jest.fn(),
    };
  }

  function criarPasswordHasherFake(): PasswordHasher {
    return { hash: jest.fn().mockResolvedValue('senha-hash'), comparar: jest.fn() };
  }

  const permissoesBase: PermissaoRecurso[] = [
    { recurso: 'CAMPANHAS', podeCriar: true, podeEditar: true, podeRemover: false },
  ];

  const inputBase = {
    administradorId: 'dono-1',
    nome: 'Maria Souza',
    email: 'maria@example.com',
    telefone: '31999998888',
    cpf: CPF_VALIDO,
    rg: 'MG-12.345.678',
    senha: 'senhaForte123',
    permissoes: permissoesBase,
  };

  it('cadastra um membro válido com e-mail já confirmado', async () => {
    const dono = criarDono();
    const repositorio = criarRepositorioFake(dono);
    const passwordHasher = criarPasswordHasherFake();
    const useCase = new CadastrarAdministradorMembroUseCase(repositorio, passwordHasher);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.membroId).toBeDefined();
    expect(repositorio.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: CPF_VALIDO,
        senhaHash: 'senha-hash',
        emailConfirmado: true,
        administradorProprietarioId: 'dono-1',
        permissoes: permissoesBase,
      }),
    );
  });

  it('rejeita CPF inválido', async () => {
    const repositorio = criarRepositorioFake(criarDono());
    const useCase = new CadastrarAdministradorMembroUseCase(repositorio, criarPasswordHasherFake());

    await expect(useCase.executar({ ...inputBase, cpf: '111.111.111-11' })).rejects.toThrow('CPF inválido.');
  });

  it('rejeita e-mail já cadastrado', async () => {
    const existente = new Administrador(
      'outro',
      'Outro',
      'maria@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
    const repositorio = criarRepositorioFake(criarDono(), [existente]);
    const useCase = new CadastrarAdministradorMembroUseCase(repositorio, criarPasswordHasherFake());

    await expect(useCase.executar(inputBase)).rejects.toThrow('Este e-mail já está em uso.');
  });

  it('rejeita CPF já cadastrado', async () => {
    const existente = new Administrador(
      'outro',
      'Outro',
      'outro@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      CPF_VALIDO,
    );
    const repositorio = criarRepositorioFake(criarDono(), [existente]);
    const useCase = new CadastrarAdministradorMembroUseCase(repositorio, criarPasswordHasherFake());

    await expect(useCase.executar(inputBase)).rejects.toThrow('Este CPF já está cadastrado.');
  });

  it('vincula o membro à conta do proprietário quando o solicitante já é um membro', async () => {
    const membroSolicitante = new Administrador(
      'membro-1',
      'Membro',
      'membro@example.com',
      'hash',
      true,
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      'dono-1',
    );
    const repositorio = criarRepositorioFake(membroSolicitante);
    const useCase = new CadastrarAdministradorMembroUseCase(repositorio, criarPasswordHasherFake());

    await useCase.executar({ ...inputBase, administradorId: 'membro-1' });

    expect(repositorio.criar).toHaveBeenCalledWith(
      expect.objectContaining({ administradorProprietarioId: 'dono-1' }),
    );
  });

  it('exige senha com pelo menos 6 caracteres', async () => {
    const repositorio = criarRepositorioFake(criarDono());
    const useCase = new CadastrarAdministradorMembroUseCase(repositorio, criarPasswordHasherFake());

    await expect(useCase.executar({ ...inputBase, senha: '123' })).rejects.toThrow(
      'A senha deve ter pelo menos 6 caracteres.',
    );
  });
});

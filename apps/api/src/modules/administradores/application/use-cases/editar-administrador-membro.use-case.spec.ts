import { Administrador, PermissaoRecurso } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { EditarAdministradorMembroUseCase } from './editar-administrador-membro.use-case';

function criarAdministrador(overrides: Partial<{
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  rg: string | null;
  administradorProprietarioId: string | null;
}> = {}): Administrador {
  return new Administrador(
    overrides.id ?? 'admin-1',
    overrides.nome ?? 'Nome',
    overrides.email ?? 'email@example.com',
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
    overrides.telefone ?? null,
    overrides.cpf ?? null,
    overrides.rg ?? null,
    overrides.administradorProprietarioId ?? null,
  );
}

describe('EditarAdministradorMembroUseCase', () => {
  function criarRepositorioFake(
    dono: Administrador | null,
    membro: Administrador | null,
    outros: Administrador[] = [],
  ): AdministradorRepository {
    return {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => {
        if (dono?.id === id) return dono;
        if (membro?.id === id) return membro;
        return null;
      }),
      buscarPorEmail: jest.fn().mockImplementation(async (email: string) =>
        outros.find((a) => a.email === email) ?? null,
      ),
      buscarPorCpf: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      listarMembrosDaConta: jest.fn(),
      salvar: jest.fn(),
      criar: jest.fn(),
      remover: jest.fn(),
    };
  }

  it('atualiza dados cadastrais e permissões de um membro', async () => {
    const dono = criarAdministrador({ id: 'dono-1' });
    const membro = criarAdministrador({ id: 'membro-1', administradorProprietarioId: 'dono-1' });
    const repositorio = criarRepositorioFake(dono, membro);
    const useCase = new EditarAdministradorMembroUseCase(repositorio);
    const novasPermissoes: PermissaoRecurso[] = [
      { recurso: 'GRUPOS', podeCriar: true, podeEditar: false, podeRemover: false },
    ];

    await useCase.executar({
      administradorId: 'dono-1',
      membroId: 'membro-1',
      telefone: '31988887777',
      permissoes: novasPermissoes,
    });

    expect(membro.telefone).toBe('31988887777');
    expect(membro.permissoes).toEqual(novasPermissoes);
    expect(repositorio.salvar).toHaveBeenCalledWith(membro);
  });

  it('rejeita editar um membro de outra conta', async () => {
    const dono = criarAdministrador({ id: 'dono-1' });
    const membroDeOutraConta = criarAdministrador({ id: 'membro-2', administradorProprietarioId: 'outro-dono' });
    const repositorio = criarRepositorioFake(dono, membroDeOutraConta);
    const useCase = new EditarAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'membro-2', nome: 'Novo nome' }),
    ).rejects.toThrow('Administrador não encontrado.');
  });

  it('rejeita editar o próprio dono via este caso de uso', async () => {
    const dono = criarAdministrador({ id: 'dono-1' });
    const repositorio = criarRepositorioFake(dono, null);
    const useCase = new EditarAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'dono-1', nome: 'Novo nome' }),
    ).rejects.toThrow('Administrador não encontrado.');
  });

  it('rejeita e-mail já usado por outro administrador', async () => {
    const dono = criarAdministrador({ id: 'dono-1' });
    const membro = criarAdministrador({ id: 'membro-1', administradorProprietarioId: 'dono-1' });
    const outro = criarAdministrador({ id: 'outro-1', email: 'em-uso@example.com' });
    const repositorio = criarRepositorioFake(dono, membro, [outro]);
    const useCase = new EditarAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'membro-1', email: 'em-uso@example.com' }),
    ).rejects.toThrow('Este e-mail já está em uso.');
  });

  it('rejeita telefone inválido', async () => {
    const dono = criarAdministrador({ id: 'dono-1' });
    const membro = criarAdministrador({ id: 'membro-1', administradorProprietarioId: 'dono-1' });
    const repositorio = criarRepositorioFake(dono, membro);
    const useCase = new EditarAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'membro-1', telefone: '123' }),
    ).rejects.toThrow('Telefone inválido.');
  });
});

import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { ExcluirAdministradorMembroUseCase } from './excluir-administrador-membro.use-case';

function criarAdministrador(
  id: string,
  administradorProprietarioId: string | null = null,
): Administrador {
  return new Administrador(
    id,
    'Nome',
    `${id}@example.com`,
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
    administradorProprietarioId,
  );
}

describe('ExcluirAdministradorMembroUseCase', () => {
  function criarRepositorioFake(administradores: Administrador[]): AdministradorRepository {
    return {
      buscarPorId: jest.fn().mockImplementation(async (id: string) => administradores.find((a) => a.id === id) ?? null),
      buscarPorEmail: jest.fn(),
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

  it('remove um membro que pertence à conta do dono', async () => {
    const dono = criarAdministrador('dono-1');
    const membro = criarAdministrador('membro-1', 'dono-1');
    const repositorio = criarRepositorioFake([dono, membro]);
    const useCase = new ExcluirAdministradorMembroUseCase(repositorio);

    await useCase.executar({ administradorId: 'dono-1', membroId: 'membro-1' });

    expect(repositorio.remover).toHaveBeenCalledWith('membro-1');
  });

  it('rejeita remover um membro de outra conta', async () => {
    const dono = criarAdministrador('dono-1');
    const membroDeOutraConta = criarAdministrador('membro-2', 'outro-dono');
    const repositorio = criarRepositorioFake([dono, membroDeOutraConta]);
    const useCase = new ExcluirAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'membro-2' }),
    ).rejects.toThrow('Administrador não encontrado.');
    expect(repositorio.remover).not.toHaveBeenCalled();
  });

  it('rejeita excluir o próprio dono via este caso de uso', async () => {
    const dono = criarAdministrador('dono-1');
    const repositorio = criarRepositorioFake([dono]);
    const useCase = new ExcluirAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'dono-1' }),
    ).rejects.toThrow('Administrador não encontrado.');
    expect(repositorio.remover).not.toHaveBeenCalled();
  });
});

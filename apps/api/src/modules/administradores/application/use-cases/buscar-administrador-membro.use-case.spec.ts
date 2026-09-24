import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { BuscarAdministradorMembroUseCase } from './buscar-administrador-membro.use-case';

function criarAdministrador(id: string, administradorProprietarioId: string | null = null): Administrador {
  return new Administrador(
    id,
    'Nome',
    `${id}@example.com`,
    'hash-secreto',
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

describe('BuscarAdministradorMembroUseCase', () => {
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

  it('retorna o resumo do membro sem senha quando pertence à conta do dono', async () => {
    const dono = criarAdministrador('dono-1');
    const membro = criarAdministrador('membro-1', 'dono-1');
    const repositorio = criarRepositorioFake([dono, membro]);
    const useCase = new BuscarAdministradorMembroUseCase(repositorio);

    const resultado = await useCase.executar({ administradorId: 'dono-1', membroId: 'membro-1' });

    expect(resultado.id).toBe('membro-1');
    expect(resultado).not.toHaveProperty('senhaHash');
  });

  it('lança erro se o membro não existir', async () => {
    const dono = criarAdministrador('dono-1');
    const repositorio = criarRepositorioFake([dono]);
    const useCase = new BuscarAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'inexistente' }),
    ).rejects.toThrow('Administrador não encontrado.');
  });

  it('lança erro se o membro pertencer a outra conta', async () => {
    const dono = criarAdministrador('dono-1');
    const membroDeOutraConta = criarAdministrador('membro-2', 'outro-dono');
    const repositorio = criarRepositorioFake([dono, membroDeOutraConta]);
    const useCase = new BuscarAdministradorMembroUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'dono-1', membroId: 'membro-2' }),
    ).rejects.toThrow('Administrador não encontrado.');
  });
});

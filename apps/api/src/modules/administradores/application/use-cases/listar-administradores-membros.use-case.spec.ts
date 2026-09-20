import { Administrador } from '../../domain/entities/administrador.entity';
import { AdministradorRepository } from '../../domain/repositories/administrador.repository';
import { ListarAdministradoresMembrosUseCase } from './listar-administradores-membros.use-case';

function criarAdministrador(id: string, administradorProprietarioId: string | null = null): Administrador {
  return new Administrador(
    id,
    'Nome',
    `${id}@example.com`,
    'hash-secreto',
    true,
    new Date('2026-01-01T00:00:00Z'),
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
    [{ recurso: 'CAMPANHAS', podeCriar: true, podeEditar: false, podeRemover: false }],
  );
}

describe('ListarAdministradoresMembrosUseCase', () => {
  function criarRepositorioFake(dono: Administrador, membros: Administrador[]): AdministradorRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(dono),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorTokenConfirmacaoEmail: jest.fn(),
      buscarPorTokenRecuperacaoSenha: jest.fn(),
      buscarPorTokenConfirmacaoNovoEmail: jest.fn(),
      listarMembrosDaConta: jest.fn().mockResolvedValue(membros),
      salvar: jest.fn(),
      criar: jest.fn(),
      remover: jest.fn(),
    };
  }

  it('lista os membros da conta sem expor a senha', async () => {
    const dono = criarAdministrador('dono-1');
    const membro = criarAdministrador('membro-1', 'dono-1');
    const repositorio = criarRepositorioFake(dono, [membro]);
    const useCase = new ListarAdministradoresMembrosUseCase(repositorio);

    const resultado = await useCase.executar({ administradorId: 'dono-1' });

    expect(repositorio.listarMembrosDaConta).toHaveBeenCalledWith('dono-1');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).not.toHaveProperty('senhaHash');
    expect(resultado[0].permissoes).toEqual([
      { recurso: 'CAMPANHAS', podeCriar: true, podeEditar: false, podeRemover: false },
    ]);
  });

  it('resolve a conta do proprietário quando o solicitante é um membro', async () => {
    const membroSolicitante = criarAdministrador('membro-1', 'dono-1');
    const repositorio = criarRepositorioFake(membroSolicitante, []);
    const useCase = new ListarAdministradoresMembrosUseCase(repositorio);

    await useCase.executar({ administradorId: 'membro-1' });

    expect(repositorio.listarMembrosDaConta).toHaveBeenCalledWith('dono-1');
  });
});

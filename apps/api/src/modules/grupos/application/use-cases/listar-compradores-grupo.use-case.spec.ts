import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { ListarCompradoresDoGrupoUseCase } from './listar-compradores-grupo.use-case';

describe('ListarCompradoresDoGrupoUseCase', () => {
  function criarRepositorio(grupo: Grupo | null) {
    const repositorio: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest
        .fn()
        .mockResolvedValue([{ id: 'comprador-1', nome: 'Maria', telefone: '5511988887777' }]),
      criar: jest.fn(),
    };
    return repositorio;
  }

  it('lista os compradores de um grupo existente', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const repositorio = criarRepositorio(grupo);
    const useCase = new ListarCompradoresDoGrupoUseCase(repositorio);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([{ id: 'comprador-1', nome: 'Maria', telefone: '5511988887777' }]);
  });

  it('rejeita quando o grupo não existe', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new ListarCompradoresDoGrupoUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'inexistente' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const repositorio = criarRepositorio(grupo);
    const useCase = new ListarCompradoresDoGrupoUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

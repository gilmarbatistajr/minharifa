import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { ListarGruposDoAdministradorUseCase } from './listar-grupos-administrador.use-case';

describe('ListarGruposDoAdministradorUseCase', () => {
  it('retorna os grupos do administrador autenticado', async () => {
    const grupos = [new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date())];
    const repositorio: GrupoRepository = {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(grupos),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const useCase = new ListarGruposDoAdministradorUseCase(repositorio);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toBe(grupos);
    expect(repositorio.listarPorAdministrador).toHaveBeenCalledWith('admin-1');
  });
});

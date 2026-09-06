import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { CadastrarGrupoUseCase } from './cadastrar-grupo.use-case';

describe('CadastrarGrupoUseCase', () => {
  function criarRepositorio(existente: Grupo | null): GrupoRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorIdentificadorWhatsapp: jest.fn().mockResolvedValue(existente),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('cadastra um novo grupo para o administrador', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new CadastrarGrupoUseCase(repositorio);

    const resultado = await useCase.executar({
      administradorId: 'admin-1',
      nome: 'Amigos do bem',
      identificadorWhatsapp: '5511999999999',
    });

    expect(resultado.grupoId).toBeDefined();
    expect(repositorio.criar).toHaveBeenCalled();
  });

  it('rejeita quando o grupo do WhatsApp já está vinculado a outro administrador', async () => {
    const existente = new Grupo('grupo-1', 'admin-2', 'Outro grupo', '5511999999999', new Date());
    const repositorio = criarRepositorio(existente);
    const useCase = new CadastrarGrupoUseCase(repositorio);

    await expect(
      useCase.executar({
        administradorId: 'admin-1',
        nome: 'Amigos do bem',
        identificadorWhatsapp: '5511999999999',
      }),
    ).rejects.toThrow('já está vinculado a outro administrador');
  });
});

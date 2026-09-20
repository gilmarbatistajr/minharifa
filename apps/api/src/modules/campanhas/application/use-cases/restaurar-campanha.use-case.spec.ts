import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { RestaurarCampanhaUseCase } from './restaurar-campanha.use-case';

describe('RestaurarCampanhaUseCase', () => {
  function criarCampanha(administradorId = 'admin-1', removida = true): Campanha {
    const campanha = new Campanha(
      'campanha-1',
      administradorId,
      null,
      'Campanha de teste',
      'Descrição',
      ['premio-1'],
      null,
      null,
      null,
      100,
      50,
      'ESCOLHA_NUMERO',
      'NOVO',
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );
    if (removida) {
      campanha.remover(new Date('2026-01-01T00:00:00Z'));
    }
    return campanha;
  }

  function criarRepositorio(campanha: Campanha | null): CampanhaRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('restaura uma campanha removida', async () => {
    const campanha = criarCampanha();
    const repositorio = criarRepositorio(campanha);
    const useCase = new RestaurarCampanhaUseCase(repositorio);

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' });

    expect(campanha.removidaEm).toBeNull();
    expect(repositorio.salvar).toHaveBeenCalledWith(campanha);
  });

  it('rejeita quando a campanha não existe', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new RestaurarCampanhaUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'inexistente' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita restaurar uma campanha que não está removida', async () => {
    const campanha = criarCampanha('admin-1', false);
    const repositorio = criarRepositorio(campanha);
    const useCase = new RestaurarCampanhaUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('não está removida');
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { RemoverCampanhaUseCase } from './remover-campanha.use-case';

describe('RemoverCampanhaUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
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

  it('marca a campanha como removida', async () => {
    const campanha = criarCampanha();
    const repositorio = criarRepositorio(campanha);
    const useCase = new RemoverCampanhaUseCase(repositorio);
    const agora = new Date('2026-01-05T00:00:00Z');

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }, agora);

    expect(campanha.removidaEm).toEqual(agora);
    expect(repositorio.salvar).toHaveBeenCalledWith(campanha);
  });

  it('rejeita quando a campanha não existe', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new RemoverCampanhaUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'inexistente' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const repositorio = criarRepositorio(campanha);
    const useCase = new RemoverCampanhaUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita remover uma campanha já removida', async () => {
    const campanha = criarCampanha();
    campanha.remover(new Date('2026-01-01T00:00:00Z'));
    const repositorio = criarRepositorio(campanha);
    const useCase = new RemoverCampanhaUseCase(repositorio);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('já está removida');
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { MarcarCampanhaComoRevisadaUseCase } from './marcar-campanha-como-revisada.use-case';

describe('MarcarCampanhaComoRevisadaUseCase', () => {
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

  function criarDependencias(campanha: Campanha | null) {
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn().mockResolvedValue(campanha),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };

    return { campanhaRepository };
  }

  it('marca a campanha como aguardando liberação', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = new MarcarCampanhaComoRevisadaUseCase(deps.campanhaRepository);

    await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' });

    expect(campanha.status).toBe('AGUARDANDO_LIBERACAO');
    expect(deps.campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null);
    const useCase = new MarcarCampanhaComoRevisadaUseCase(deps.campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'inexistente' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const deps = criarDependencias(campanha);
    const useCase = new MarcarCampanhaComoRevisadaUseCase(deps.campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('propaga o erro de negócio quando a campanha já não está NOVA', async () => {
    const campanha = criarCampanha();
    campanha.status = 'LIBERADA';
    const deps = criarDependencias(campanha);
    const useCase = new MarcarCampanhaComoRevisadaUseCase(deps.campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Somente campanhas novas');
    expect(deps.campanhaRepository.salvar).not.toHaveBeenCalled();
  });
});

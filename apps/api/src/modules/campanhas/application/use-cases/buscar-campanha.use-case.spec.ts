import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { BuscarCampanhaUseCase } from './buscar-campanha.use-case';

describe('BuscarCampanhaUseCase', () => {
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
      salvar: jest.fn(),
    };

    return { campanhaRepository };
  }

  it('retorna a campanha quando pertence ao administrador', async () => {
    const campanha = criarCampanha();
    const deps = criarDependencias(campanha);
    const useCase = new BuscarCampanhaUseCase(deps.campanhaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' });

    expect(resultado).toBe(campanha);
  });

  it('rejeita quando a campanha não existe', async () => {
    const deps = criarDependencias(null);
    const useCase = new BuscarCampanhaUseCase(deps.campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'inexistente' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const deps = criarDependencias(campanha);
    const useCase = new BuscarCampanhaUseCase(deps.campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', campanhaId: 'campanha-1' }),
    ).rejects.toThrow('Campanha não encontrada.');
  });
});

import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { ListarCampanhasDoAdministradorUseCase } from './listar-campanhas-administrador.use-case';

describe('ListarCampanhasDoAdministradorUseCase', () => {
  function criarCampanha(id: string): Campanha {
    return new Campanha(
      id,
      'admin-1',
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

  it('retorna as campanhas do administrador, lançadas ou não', async () => {
    const campanhas = [criarCampanha('campanha-1'), criarCampanha('campanha-2')];
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn(),
      listarPorAdministrador: jest.fn().mockResolvedValue(campanhas),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
    const useCase = new ListarCampanhasDoAdministradorUseCase(campanhaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1' });

    expect(resultado).toEqual(campanhas);
    expect(campanhaRepository.listarPorAdministrador).toHaveBeenCalledWith('admin-1');
  });
});

import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Campanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { ListarCampanhasDoGrupoUseCase } from './listar-campanhas-grupo.use-case';

describe('ListarCampanhasDoGrupoUseCase', () => {
  function criarDependencias(grupo: Grupo | null, campanhas: Campanha[]) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const campanhaRepository: CampanhaRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockResolvedValue(campanhas),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };

    return { grupoRepository, campanhaRepository };
  }

  it('retorna as campanhas do grupo quando ele pertence ao administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const campanha = new Campanha(
      'campanha-1',
      'admin-1',
      'grupo-1',
      'Campanha de Natal',
      'desc',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'ESCOLHA_NUMERO',
      'LIBERADA',
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );
    const deps = criarDependencias(grupo, [campanha]);
    const useCase = new ListarCampanhasDoGrupoUseCase(deps.grupoRepository, deps.campanhaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([campanha]);
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(grupo, []);
    const useCase = new ListarCampanhasDoGrupoUseCase(deps.grupoRepository, deps.campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { ListarSorteiosDoGrupoUseCase } from './listar-sorteios-grupo.use-case';

describe('ListarSorteiosDoGrupoUseCase', () => {
  function criarDependencias(grupo: Grupo | null, sorteios: Sorteio[]) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const sorteioRepository: SorteioRepository = {
      buscarPorId: jest.fn(),
      listarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockResolvedValue(sorteios),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn(),
    };

    return { grupoRepository, sorteioRepository };
  }

  it('retorna os sorteios do grupo quando ele pertence ao administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const sorteio = new Sorteio(
      'sorteio-1',
      'grupo-1',
      'Sorteio de Natal',
      'desc',
      ['premio-1'],
      new Date(),
      new Date(),
      new Date(),
      100,
      50,
      'AGUARDANDO_ABERTURA',
      null,
      null,
    );
    const deps = criarDependencias(grupo, [sorteio]);
    const useCase = new ListarSorteiosDoGrupoUseCase(deps.grupoRepository, deps.sorteioRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual([sorteio]);
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const deps = criarDependencias(grupo, []);
    const useCase = new ListarSorteiosDoGrupoUseCase(deps.grupoRepository, deps.sorteioRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

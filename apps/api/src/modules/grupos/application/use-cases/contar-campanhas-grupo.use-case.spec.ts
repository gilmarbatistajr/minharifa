import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Campanha, StatusVendasCampanha } from '../../../campanhas/domain/entities/campanha.entity';
import { CampanhaRepository } from '../../../campanhas/domain/repositories/campanha.repository';
import { ContarCampanhasDoGrupoUseCase } from './contar-campanhas-grupo.use-case';

function criarCampanha(id: string, statusVendas: StatusVendasCampanha): Campanha {
  return new Campanha(
    id,
    'admin-1',
    'grupo-1',
    'Campanha de teste',
    'Descrição de teste',
    ['premio-1'],
    new Date(),
    new Date(),
    new Date(),
    100,
    50,
    'ESCOLHA_NUMERO',
    'LIBERADA',
    statusVendas,
    null,
    null,
  );
}

describe('ContarCampanhasDoGrupoUseCase', () => {
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

  it('conta campanhas finalizadas e em andamento separadamente', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const campanhas = [
      criarCampanha('c1', 'FINALIZADO'),
      criarCampanha('c2', 'FINALIZADO'),
      criarCampanha('c3', 'VENDAS_ABERTAS'),
      criarCampanha('c4', 'COTAS_ESGOTADAS'),
      criarCampanha('c5', 'CANCELADO'),
    ];
    const { grupoRepository, campanhaRepository } = criarDependencias(grupo, campanhas);
    const useCase = new ContarCampanhasDoGrupoUseCase(grupoRepository, campanhaRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual({ finalizados: 2, emAndamento: 2 });
  });

  it('rejeita quando o grupo não existe', async () => {
    const { grupoRepository, campanhaRepository } = criarDependencias(null, []);
    const useCase = new ContarCampanhasDoGrupoUseCase(grupoRepository, campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'inexistente' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, campanhaRepository } = criarDependencias(grupo, []);
    const useCase = new ContarCampanhasDoGrupoUseCase(grupoRepository, campanhaRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

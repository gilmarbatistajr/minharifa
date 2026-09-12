import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { Sorteio } from '../../../sorteios/domain/entities/sorteio.entity';
import { SorteioRepository } from '../../../sorteios/domain/repositories/sorteio.repository';
import { ContarSorteiosDoGrupoUseCase } from './contar-sorteios-grupo.use-case';

function criarSorteio(id: string, status: Sorteio['status']): Sorteio {
  return new Sorteio(id, 'grupo-1', 'premio-1', new Date(), new Date(), new Date(), 100, 50, status, null, null);
}

describe('ContarSorteiosDoGrupoUseCase', () => {
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
      buscarPorPremioId: jest.fn(),
      listarPorGrupo: jest.fn().mockResolvedValue(sorteios),
      listarPorAdministrador: jest.fn(),
      salvar: jest.fn(),
    };

    return { grupoRepository, sorteioRepository };
  }

  it('conta sorteios finalizados e em andamento separadamente', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const sorteios = [
      criarSorteio('s1', 'FINALIZADO'),
      criarSorteio('s2', 'FINALIZADO'),
      criarSorteio('s3', 'VENDAS_ABERTAS'),
      criarSorteio('s4', 'COTAS_ESGOTADAS'),
      criarSorteio('s5', 'CANCELADO'),
    ];
    const { grupoRepository, sorteioRepository } = criarDependencias(grupo, sorteios);
    const useCase = new ContarSorteiosDoGrupoUseCase(grupoRepository, sorteioRepository);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado).toEqual({ finalizados: 2, emAndamento: 2 });
  });

  it('rejeita quando o grupo não existe', async () => {
    const { grupoRepository, sorteioRepository } = criarDependencias(null, []);
    const useCase = new ContarSorteiosDoGrupoUseCase(grupoRepository, sorteioRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'inexistente' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, sorteioRepository } = criarDependencias(grupo, []);
    const useCase = new ContarSorteiosDoGrupoUseCase(grupoRepository, sorteioRepository);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

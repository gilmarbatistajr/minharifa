import { Grupo } from '../../domain/entities/grupo.entity';
import { GrupoRepository } from '../../domain/repositories/grupo.repository';
import { LinkConviteRepository } from '../../domain/repositories/link-convite.repository';
import { TokenGenerator } from '../../../../shared/domain/token-generator';
import { GerarLinkConviteUseCase } from './gerar-link-convite.use-case';

describe('GerarLinkConviteUseCase', () => {
  function criarDependencias(grupo: Grupo | null) {
    const grupoRepository: GrupoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(grupo),
      buscarPorIdentificadorWhatsapp: jest.fn(),
      listarPorAdministrador: jest.fn(),
      listarCompradores: jest.fn(),
      criar: jest.fn(),
    };
    const linkConviteRepository: LinkConviteRepository = {
      buscarPorId: jest.fn(),
      buscarPorCodigo: jest.fn(),
      criar: jest.fn().mockResolvedValue(undefined),
      salvar: jest.fn(),
    };
    const tokenGenerator: TokenGenerator = {
      gerar: jest.fn().mockReturnValue('codigolongoaleatorio'),
    };

    return { grupoRepository, linkConviteRepository, tokenGenerator };
  }

  it('gera um link de convite ativo para o grupo', async () => {
    const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, linkConviteRepository, tokenGenerator } = criarDependencias(grupo);
    const useCase = new GerarLinkConviteUseCase(grupoRepository, linkConviteRepository, tokenGenerator);

    const resultado = await useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' });

    expect(resultado.codigo).toBe('codigolong');
    expect(linkConviteRepository.criar).toHaveBeenCalled();
  });

  it('rejeita quando o grupo não existe', async () => {
    const { grupoRepository, linkConviteRepository, tokenGenerator } = criarDependencias(null);
    const useCase = new GerarLinkConviteUseCase(grupoRepository, linkConviteRepository, tokenGenerator);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'inexistente' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });

  it('rejeita quando o grupo pertence a outro administrador', async () => {
    const grupo = new Grupo('grupo-1', 'admin-2', 'Amigos do bem', '5511999999999', new Date());
    const { grupoRepository, linkConviteRepository, tokenGenerator } = criarDependencias(grupo);
    const useCase = new GerarLinkConviteUseCase(grupoRepository, linkConviteRepository, tokenGenerator);

    await expect(
      useCase.executar({ administradorId: 'admin-1', grupoId: 'grupo-1' }),
    ).rejects.toThrow('Grupo não encontrado.');
  });
});

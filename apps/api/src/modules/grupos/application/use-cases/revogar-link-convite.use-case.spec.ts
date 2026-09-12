import { LinkConvite } from '../../domain/entities/link-convite.entity';
import { LinkConviteRepository } from '../../domain/repositories/link-convite.repository';
import { RevogarLinkConviteUseCase } from './revogar-link-convite.use-case';

describe('RevogarLinkConviteUseCase', () => {
  function criarRepositorio(link: LinkConvite | null): LinkConviteRepository {
    return {
      buscarPorId: jest.fn().mockResolvedValue(link),
      buscarPorCodigo: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('revoga um link de convite ativo', async () => {
    const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'ATIVO', new Date());
    const repositorio = criarRepositorio(link);
    const useCase = new RevogarLinkConviteUseCase(repositorio);

    await useCase.executar({ linkConviteId: 'link-1' });

    expect(link.status).toBe('REVOGADO');
    expect(repositorio.salvar).toHaveBeenCalledWith(link);
  });

  it('rejeita quando o link não existe', async () => {
    const repositorio = criarRepositorio(null);
    const useCase = new RevogarLinkConviteUseCase(repositorio);

    await expect(useCase.executar({ linkConviteId: 'inexistente' })).rejects.toThrow(
      'Link de convite não encontrado.',
    );
  });
});

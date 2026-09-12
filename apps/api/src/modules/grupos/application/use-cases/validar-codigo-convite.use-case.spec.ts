import { LinkConvite } from '../../domain/entities/link-convite.entity';
import { LinkConviteRepository } from '../../domain/repositories/link-convite.repository';
import { ValidarCodigoConviteUseCase } from './validar-codigo-convite.use-case';

describe('ValidarCodigoConviteUseCase', () => {
  function criarRepositorio(link: LinkConvite | null): LinkConviteRepository {
    return {
      buscarPorId: jest.fn(),
      buscarPorCodigo: jest.fn().mockResolvedValue(link),
      criar: jest.fn(),
      salvar: jest.fn(),
    };
  }

  it('retorna o grupo quando o código é válido', async () => {
    const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'ATIVO', new Date());
    const useCase = new ValidarCodigoConviteUseCase(criarRepositorio(link));

    const resultado = await useCase.executar({ codigo: 'ABC123' });

    expect(resultado).toEqual({ grupoId: 'grupo-1' });
  });

  it('rejeita código inexistente', async () => {
    const useCase = new ValidarCodigoConviteUseCase(criarRepositorio(null));

    await expect(useCase.executar({ codigo: 'INEXISTENTE' })).rejects.toThrow(
      'Código de convite inválido.',
    );
  });

  it('rejeita código revogado', async () => {
    const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'REVOGADO', new Date());
    const useCase = new ValidarCodigoConviteUseCase(criarRepositorio(link));

    await expect(useCase.executar({ codigo: 'ABC123' })).rejects.toThrow(
      'Este link de convite foi revogado.',
    );
  });
});

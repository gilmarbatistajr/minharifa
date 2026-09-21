import { Premio } from '../../domain/entities/premio.entity';
import { PremioRepository } from '../../domain/repositories/premio.repository';
import { ImageStorage } from '../../../../shared/domain/image-storage';
import { AtualizarFotoPremioUseCase } from './atualizar-foto-premio.use-case';

describe('AtualizarFotoPremioUseCase', () => {
  function criarPremio(administradorId = 'admin-1'): Premio {
    return new Premio('premio-1', administradorId, 'iPhone 16 Pro', 'Um belo iPhone', null, 8000, null, new Date());
  }

  function criarDependencias(premio: Premio | null) {
    const premioRepository: PremioRepository = {
      buscarPorId: jest.fn().mockResolvedValue(premio),
      listarPorAdministrador: jest.fn(),
      criar: jest.fn(),
      salvar: jest.fn().mockResolvedValue(undefined),
      remover: jest.fn(),
    };
    const imageStorage: ImageStorage = { salvar: jest.fn().mockResolvedValue('/uploads/premios/arquivo.jpg') };

    return { premioRepository, imageStorage };
  }

  const inputBase = {
    administradorId: 'admin-1',
    premioId: 'premio-1',
    buffer: Buffer.from('conteudo-fake'),
    mimetype: 'image/jpeg',
  };

  it('salva a foto e atualiza o prêmio', async () => {
    const premio = criarPremio();
    const { premioRepository, imageStorage } = criarDependencias(premio);
    const useCase = new AtualizarFotoPremioUseCase(premioRepository, imageStorage);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.fotoUrl).toBe('/uploads/premios/arquivo.jpg');
    expect(premio.fotoUrl).toBe('/uploads/premios/arquivo.jpg');
    expect(imageStorage.salvar).toHaveBeenCalledWith(expect.stringContaining('premio-1'), inputBase.buffer);
    expect(premioRepository.salvar).toHaveBeenCalledWith(premio);
  });

  it('aceita formatos além de JPEG/PNG (SVG, WEBP, GIF, HEIC)', async () => {
    const premio = criarPremio();
    const { premioRepository, imageStorage } = criarDependencias(premio);
    const useCase = new AtualizarFotoPremioUseCase(premioRepository, imageStorage);

    await useCase.executar({ ...inputBase, mimetype: 'image/heic' });

    expect(imageStorage.salvar).toHaveBeenCalledWith(expect.stringContaining('.heic'), inputBase.buffer);
  });

  it('rejeita arquivo maior que 3MB', async () => {
    const premio = criarPremio();
    const { premioRepository, imageStorage } = criarDependencias(premio);
    const useCase = new AtualizarFotoPremioUseCase(premioRepository, imageStorage);
    const bufferGrande = Buffer.alloc(3 * 1024 * 1024 + 1);

    await expect(useCase.executar({ ...inputBase, buffer: bufferGrande })).rejects.toThrow('no máximo 3MB');
    expect(imageStorage.salvar).not.toHaveBeenCalled();
  });

  it('rejeita formato não suportado', async () => {
    const premio = criarPremio();
    const { premioRepository, imageStorage } = criarDependencias(premio);
    const useCase = new AtualizarFotoPremioUseCase(premioRepository, imageStorage);

    await expect(useCase.executar({ ...inputBase, mimetype: 'image/bmp' })).rejects.toThrow(
      'JPEG, PNG, SVG, WEBP, GIF ou HEIC',
    );
  });

  it('rejeita quando o prêmio não existe', async () => {
    const { premioRepository, imageStorage } = criarDependencias(null);
    const useCase = new AtualizarFotoPremioUseCase(premioRepository, imageStorage);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Prêmio não encontrado.');
  });

  it('rejeita quando o prêmio pertence a outro administrador', async () => {
    const premio = criarPremio('admin-2');
    const { premioRepository, imageStorage } = criarDependencias(premio);
    const useCase = new AtualizarFotoPremioUseCase(premioRepository, imageStorage);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Prêmio não encontrado.');
  });
});

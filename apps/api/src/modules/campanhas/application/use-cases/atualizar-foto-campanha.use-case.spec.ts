import { Campanha } from '../../domain/entities/campanha.entity';
import { CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { ImageStorage } from '../../../../shared/domain/image-storage';
import { AtualizarFotoCampanhaUseCase } from './atualizar-foto-campanha.use-case';

describe('AtualizarFotoCampanhaUseCase', () => {
  function criarCampanha(administradorId = 'admin-1'): Campanha {
    return new Campanha(
      'campanha-1',
      administradorId,
      null,
      'Campanha de teste',
      'Descrição de teste',
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
      salvar: jest.fn().mockResolvedValue(undefined),
    };
    const imageStorage: ImageStorage = { salvar: jest.fn().mockResolvedValue('/uploads/campanhas/arquivo.jpg') };

    return { campanhaRepository, imageStorage };
  }

  const inputBase = {
    administradorId: 'admin-1',
    campanhaId: 'campanha-1',
    buffer: Buffer.from('conteudo-fake'),
    mimetype: 'image/jpeg',
  };

  it('salva a foto e atualiza a campanha', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository, imageStorage } = criarDependencias(campanha);
    const useCase = new AtualizarFotoCampanhaUseCase(campanhaRepository, imageStorage);

    const resultado = await useCase.executar(inputBase);

    expect(resultado.fotoUrl).toBe('/uploads/campanhas/arquivo.jpg');
    expect(campanha.fotoUrl).toBe('/uploads/campanhas/arquivo.jpg');
    expect(imageStorage.salvar).toHaveBeenCalledWith(expect.stringContaining('campanha-1'), inputBase.buffer);
    expect(campanhaRepository.salvar).toHaveBeenCalledWith(campanha);
  });

  it('aceita formatos além de JPEG/PNG (SVG, WEBP, GIF, HEIC)', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository, imageStorage } = criarDependencias(campanha);
    const useCase = new AtualizarFotoCampanhaUseCase(campanhaRepository, imageStorage);

    await useCase.executar({ ...inputBase, mimetype: 'image/heic' });

    expect(imageStorage.salvar).toHaveBeenCalledWith(expect.stringContaining('.heic'), inputBase.buffer);
  });

  it('rejeita arquivo maior que 3MB', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository, imageStorage } = criarDependencias(campanha);
    const useCase = new AtualizarFotoCampanhaUseCase(campanhaRepository, imageStorage);
    const bufferGrande = Buffer.alloc(3 * 1024 * 1024 + 1);

    await expect(useCase.executar({ ...inputBase, buffer: bufferGrande })).rejects.toThrow('no máximo 3MB');
    expect(imageStorage.salvar).not.toHaveBeenCalled();
  });

  it('rejeita formato não suportado', async () => {
    const campanha = criarCampanha();
    const { campanhaRepository, imageStorage } = criarDependencias(campanha);
    const useCase = new AtualizarFotoCampanhaUseCase(campanhaRepository, imageStorage);

    await expect(useCase.executar({ ...inputBase, mimetype: 'image/bmp' })).rejects.toThrow(
      'JPEG, PNG, SVG, WEBP, GIF ou HEIC',
    );
  });

  it('rejeita quando a campanha não existe', async () => {
    const { campanhaRepository, imageStorage } = criarDependencias(null);
    const useCase = new AtualizarFotoCampanhaUseCase(campanhaRepository, imageStorage);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Campanha não encontrada.');
  });

  it('rejeita quando a campanha pertence a outro administrador', async () => {
    const campanha = criarCampanha('admin-2');
    const { campanhaRepository, imageStorage } = criarDependencias(campanha);
    const useCase = new AtualizarFotoCampanhaUseCase(campanhaRepository, imageStorage);

    await expect(useCase.executar(inputBase)).rejects.toThrow('Campanha não encontrada.');
  });
});

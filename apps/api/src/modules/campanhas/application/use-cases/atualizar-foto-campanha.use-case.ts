import { Inject, Injectable } from '@nestjs/common';
import { CAMPANHA_REPOSITORY, CampanhaRepository } from '../../domain/repositories/campanha.repository';
import { validarArquivoFotoCampanha } from '../../domain/services/validacoes-imagem-campanha';
import { IMAGE_STORAGE, ImageStorage } from '../../../../shared/domain/image-storage';

export interface AtualizarFotoCampanhaInput {
  administradorId: string;
  campanhaId: string;
  buffer: Buffer;
  mimetype: string;
}

export interface AtualizarFotoCampanhaOutput {
  fotoUrl: string;
}

const EXTENSAO_POR_MIMETYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** Upload da foto da campanha direto do dispositivo do administrador, em qualquer dimensão, até 3MB. */
@Injectable()
export class AtualizarFotoCampanhaUseCase {
  constructor(
    @Inject(CAMPANHA_REPOSITORY)
    private readonly campanhaRepository: CampanhaRepository,
    @Inject(IMAGE_STORAGE)
    private readonly imageStorage: ImageStorage,
  ) {}

  async executar(input: AtualizarFotoCampanhaInput): Promise<AtualizarFotoCampanhaOutput> {
    const campanha = await this.campanhaRepository.buscarPorId(input.campanhaId);

    if (!campanha || campanha.administradorId !== input.administradorId) {
      throw new Error('Campanha não encontrada.');
    }

    validarArquivoFotoCampanha(input.mimetype, input.buffer.length);

    const extensao = EXTENSAO_POR_MIMETYPE[input.mimetype];
    const nomeArquivo = `campanhas/${campanha.id}-${Date.now()}.${extensao}`;
    const fotoUrl = await this.imageStorage.salvar(nomeArquivo, input.buffer);

    campanha.definirFoto(fotoUrl);
    await this.campanhaRepository.salvar(campanha);

    return { fotoUrl };
  }
}

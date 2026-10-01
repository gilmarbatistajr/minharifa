import { Inject, Injectable } from '@nestjs/common';
import { PREMIO_REPOSITORY, PremioRepository } from '../../domain/repositories/premio.repository';
import { validarArquivoFotoPremio } from '../../domain/services/validacoes-imagem-premio';
import { IMAGE_STORAGE, ImageStorage } from '../../../../shared/domain/image-storage';

export interface AtualizarFotoPremioInput {
  administradorId: string;
  premioId: string;
  buffer: Buffer;
  mimetype: string;
}

export interface AtualizarFotoPremioOutput {
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

/**
 * Cobre upload-de-foto-de-premio.feature: upload da foto direto do
 * dispositivo do administrador, em qualquer dimensão, até 3MB.
 */
@Injectable()
export class AtualizarFotoPremioUseCase {
  constructor(
    @Inject(PREMIO_REPOSITORY)
    private readonly premioRepository: PremioRepository,
    @Inject(IMAGE_STORAGE)
    private readonly imageStorage: ImageStorage,
  ) {}

  async executar(input: AtualizarFotoPremioInput): Promise<AtualizarFotoPremioOutput> {
    const premio = await this.premioRepository.buscarPorId(input.premioId);

    if (!premio || !premio.pertenceAoAdministrador(input.administradorId)) {
      throw new Error('Prêmio não encontrado.');
    }

    validarArquivoFotoPremio(input.mimetype, input.buffer.length);

    const extensao = EXTENSAO_POR_MIMETYPE[input.mimetype];
    const nomeArquivo = `premios/${premio.id}-${Date.now()}.${extensao}`;
    const fotoUrl = await this.imageStorage.salvar(nomeArquivo, input.buffer);

    premio.definirFoto(fotoUrl);
    await this.premioRepository.salvar(premio);

    return { fotoUrl };
  }
}

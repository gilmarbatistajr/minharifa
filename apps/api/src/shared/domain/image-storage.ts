/**
 * Porta do domínio para persistência de arquivos de imagem. Implementação
 * concreta (disco local, S3, etc.) fica na camada de infrastructure.
 */
export interface ImageStorage {
  /** Salva o buffer e retorna a URL pública (relativa) do arquivo salvo. */
  salvar(nomeArquivo: string, buffer: Buffer): Promise<string>;
}

export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

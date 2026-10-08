export const TIPOS_IMAGEM_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

export const TAMANHO_MAXIMO_IMAGEM_BYTES = 3 * 1024 * 1024;

/**
 * Cobre upload-de-foto-de-premio.feature: aceita qualquer dimensão de
 * imagem nos formatos permitidos, até 3MB — a exibição em 1080x1080 é
 * responsabilidade da camada de apresentação (recorte quadrado via CSS).
 */
export function validarArquivoFotoPremio(mimetype: string, tamanhoBytes: number): void {
  if (!TIPOS_IMAGEM_PERMITIDOS.includes(mimetype)) {
    throw new Error('A imagem deve estar em um dos formatos: JPEG, PNG, SVG, WEBP, GIF ou HEIC.');
  }

  if (tamanhoBytes > TAMANHO_MAXIMO_IMAGEM_BYTES) {
    throw new Error('A imagem deve ter no máximo 3MB.');
  }
}

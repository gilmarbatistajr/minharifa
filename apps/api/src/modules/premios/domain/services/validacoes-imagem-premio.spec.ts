import { validarArquivoFotoPremio } from './validacoes-imagem-premio';

describe('validarArquivoFotoPremio', () => {
  it('aceita cada um dos formatos permitidos dentro do limite de tamanho', () => {
    const formatos = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

    for (const mimetype of formatos) {
      expect(() => validarArquivoFotoPremio(mimetype, 1024)).not.toThrow();
    }
  });

  it('aceita uma imagem de qualquer dimensão (não valida largura/altura)', () => {
    expect(() => validarArquivoFotoPremio('image/jpeg', 2 * 1024 * 1024)).not.toThrow();
  });

  it('rejeita formato não suportado', () => {
    expect(() => validarArquivoFotoPremio('image/bmp', 1024)).toThrow('JPEG, PNG, SVG, WEBP, GIF ou HEIC');
  });

  it('rejeita arquivo maior que 3MB', () => {
    const tresMegasEUmByte = 3 * 1024 * 1024 + 1;

    expect(() => validarArquivoFotoPremio('image/png', tresMegasEUmByte)).toThrow('no máximo 3MB');
  });

  it('aceita arquivo com exatamente 3MB', () => {
    expect(() => validarArquivoFotoPremio('image/png', 3 * 1024 * 1024)).not.toThrow();
  });
});

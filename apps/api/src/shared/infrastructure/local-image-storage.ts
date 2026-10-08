import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ImageStorage } from '../domain/image-storage';

// process.cwd() é a raiz de apps/api tanto em `nest start` quanto em `node dist/main`.
const PASTA_UPLOADS = join(process.cwd(), 'uploads');

@Injectable()
export class LocalImageStorage implements ImageStorage {
  async salvar(nomeArquivo: string, buffer: Buffer): Promise<string> {
    const caminhoCompleto = join(PASTA_UPLOADS, nomeArquivo);
    await mkdir(join(caminhoCompleto, '..'), { recursive: true });
    await writeFile(caminhoCompleto, buffer);

    return `/uploads/${nomeArquivo}`;
  }
}

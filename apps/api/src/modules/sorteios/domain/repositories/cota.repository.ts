import { Cota } from '../entities/cota.entity';

/**
 * Porta do domínio para persistência de cotas. A implementação concreta
 * (Prisma) fica na camada de infrastructure — o domínio e os casos de uso
 * nunca dependem diretamente do Prisma.
 */
export interface CotaRepository {
  buscarPorId(id: string): Promise<Cota | null>;
  buscarPorSorteioENumero(sorteioId: string, numero: number): Promise<Cota | null>;
  listarPorSorteio(sorteioId: string): Promise<Cota[]>;
  contarPagasPorSorteio(sorteioId: string): Promise<number>;
  salvar(cota: Cota): Promise<void>;
}

export const COTA_REPOSITORY = Symbol('COTA_REPOSITORY');

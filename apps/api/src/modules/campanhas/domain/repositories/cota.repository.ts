import { Cota } from '../entities/cota.entity';

/**
 * Porta do domínio para persistência de cotas. A implementação concreta
 * (Prisma) fica na camada de infrastructure — o domínio e os casos de uso
 * nunca dependem diretamente do Prisma.
 */
export interface ContagemPorComprador {
  compradorId: string;
  quantidade: number;
}

export interface CotaRepository {
  buscarPorId(id: string): Promise<Cota | null>;
  buscarPorCampanhaENumero(campanhaId: string, numero: number): Promise<Cota | null>;
  listarPorCampanha(campanhaId: string): Promise<Cota[]>;
  /** Cobre a regra de pagamento único do lote: todas as cotas RESERVADA do comprador nessa campanha. */
  listarReservadasPorComprador(campanhaId: string, compradorId: string): Promise<Cota[]>;
  contarPagasPorCampanha(campanhaId: string): Promise<number>;
  /** Conta cotas PAGAS por comprador, considerando todas as campanhas de um grupo. */
  contarPagasAgrupadoPorComprador(grupoId: string): Promise<ContagemPorComprador[]>;
  /** Conta cotas PAGAS por comprador, considerando todos os grupos de um administrador. */
  contarPagasAgrupadoPorCompradorDoAdministrador(administradorId: string): Promise<ContagemPorComprador[]>;
  criarEmLote(cotas: Cota[]): Promise<void>;
  salvar(cota: Cota): Promise<void>;
}

export const COTA_REPOSITORY = Symbol('COTA_REPOSITORY');

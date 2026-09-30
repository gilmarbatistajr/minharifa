import { Pagamento } from '../entities/pagamento.entity';

export interface PagamentoRepository {
  buscarPorId(id: string): Promise<Pagamento | null>;
  buscarPorCotaId(cotaId: string): Promise<Pagamento | null>;
  /** Vários pagamentos (um por cota) podem compartilhar o mesmo `idTransacaoGateway` quando pagos juntos em lote. */
  listarPorTransacaoGateway(idTransacaoGateway: string): Promise<Pagamento[]>;
  /** Cobre a listagem administrativa de "cotas compradas": um pagamento por cota, buscados em lote. */
  listarPorCotaIds(cotaIds: string[]): Promise<Pagamento[]>;
  criar(pagamento: Pagamento): Promise<void>;
  salvar(pagamento: Pagamento): Promise<void>;
}

export const PAGAMENTO_REPOSITORY = Symbol('PAGAMENTO_REPOSITORY');

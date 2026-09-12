import { Pagamento } from '../entities/pagamento.entity';

export interface PagamentoRepository {
  buscarPorId(id: string): Promise<Pagamento | null>;
  buscarPorCotaId(cotaId: string): Promise<Pagamento | null>;
  buscarPorTransacaoGateway(idTransacaoGateway: string): Promise<Pagamento | null>;
  criar(pagamento: Pagamento): Promise<void>;
  salvar(pagamento: Pagamento): Promise<void>;
}

export const PAGAMENTO_REPOSITORY = Symbol('PAGAMENTO_REPOSITORY');

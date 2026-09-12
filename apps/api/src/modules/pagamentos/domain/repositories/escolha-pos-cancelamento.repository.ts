import { EscolhaPosCancelamento } from '../entities/escolha-pos-cancelamento.entity';

export interface EscolhaPosCancelamentoRepository {
  buscarPorId(id: string): Promise<EscolhaPosCancelamento | null>;
  listarPendentesExpiradas(agora: Date): Promise<EscolhaPosCancelamento[]>;
  criar(escolha: EscolhaPosCancelamento): Promise<void>;
  salvar(escolha: EscolhaPosCancelamento): Promise<void>;
}

export const ESCOLHA_POS_CANCELAMENTO_REPOSITORY = Symbol('ESCOLHA_POS_CANCELAMENTO_REPOSITORY');

export type Medalha = 'OURO' | 'PRATA' | 'BRONZE';

export interface RankingItem {
  posicao: number;
  medalha: Medalha;
  compradorId: string;
  nome: string;
  quantidade: number;
}

/** Ranking de vencedores: nome/telefone preenchidos pelo administrador/operador ao finalizar cada campanha. */
export interface RankingVencedorItem extends RankingItem {
  telefone: string;
}

export const MEDALHAS: Medalha[] = ['OURO', 'PRATA', 'BRONZE'];
export const TAMANHO_RANKING = 3;

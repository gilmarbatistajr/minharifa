export type Medalha = 'OURO' | 'PRATA' | 'BRONZE';

export interface RankingItem {
  posicao: number;
  medalha: Medalha;
  compradorId: string;
  nome: string;
  quantidade: number;
}

export const MEDALHAS: Medalha[] = ['OURO', 'PRATA', 'BRONZE'];
export const TAMANHO_RANKING = 3;

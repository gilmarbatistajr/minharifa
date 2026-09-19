import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { Spinner } from './Spinner';
import type { RankingItem } from '../../lib/api';

const EMOJI_MEDALHA: Record<RankingItem['medalha'], string> = {
  OURO: '🥇',
  PRATA: '🥈',
  BRONZE: '🥉',
};

export function RankingCard({
  titulo,
  itens,
  rotuloQuantidade,
}: {
  titulo: string;
  itens: RankingItem[] | null;
  rotuloQuantidade: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-wide text-muted">{titulo}</p>

      {itens === null && (
        <div className="flex justify-center py-6 text-muted">
          <Spinner size={18} />
        </div>
      )}

      {itens?.length === 0 && (
        <EmptyState title="Ainda sem dados" description="O ranking aparece assim que houver resultados." />
      )}

      {itens && itens.length > 0 && (
        <div className="flex flex-col gap-2">
          {itens.map((item) => (
            <div
              key={item.compradorId}
              className="flex items-center justify-between rounded-lg bg-mist px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{EMOJI_MEDALHA[item.medalha]}</span>
                <span className="text-sm font-medium text-night">{item.nome}</span>
              </div>
              <span className="font-mono text-xs text-muted">
                {item.quantidade} {rotuloQuantidade}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconPlus, IconGift } from '../../../../components/ui/icons';
import { campanhasApi, premiosApi, urlArquivoApi, type Campanha, type Premio } from '../../../../lib/api';
import { formatarMoeda, formatarStatusCampanha } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  NOVO: 'neutral',
  AGUARDANDO_LIBERACAO: 'warning',
  LIBERADA: 'accent',
  LIBERADA_PARA_SORTEIO: 'warning',
  FINALIZADA: 'neutral',
};

type FiltroStatus =
  | 'TODAS'
  | 'NOVO'
  | 'AGUARDANDO_LIBERACAO'
  | 'LIBERADA'
  | 'LIBERADA_PARA_SORTEIO'
  | 'FINALIZADA'
  | 'REMOVIDA';

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: 'TODAS', label: 'Todas' },
  { valor: 'NOVO', label: 'Novo' },
  { valor: 'AGUARDANDO_LIBERACAO', label: 'Aguardando liberação' },
  { valor: 'LIBERADA', label: 'Vendas abertas' },
  { valor: 'LIBERADA_PARA_SORTEIO', label: 'Vendas encerradas' },
  { valor: 'FINALIZADA', label: 'Finalizada' },
  { valor: 'REMOVIDA', label: 'Removidas' },
];

export default function ListaCampanhasPage() {
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();
  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null);
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODAS');

  useEffect(() => {
    if (!sessao) return;
    campanhasApi.listar(sessao.token).then(setCampanhas);
    premiosApi.listar(sessao.token).then(setPremios);
  }, [sessao]);

  const premiosPorId = new Map((premios ?? []).map((premio) => [premio.id, premio]));

  // "Removidas" é um balde à parte: por padrão (e em qualquer filtro de status)
  // campanhas removidas ficam ocultas — só aparecem quando esse filtro é escolhido.
  const campanhasFiltradas = (campanhas ?? []).filter((campanha) => {
    if (filtroStatus === 'REMOVIDA') return campanha.removidaEm !== null;
    if (campanha.removidaEm) return false;
    return filtroStatus === 'TODAS' || campanha.status === filtroStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Campanhas"
        title="Minhas campanhas"
        description="Crie o conteúdo da campanha, revise e lance para um grupo quando estiver pronta."
        action={
          <Button onClick={() => router.push('/admin/campanhas/novo')}>
            <IconPlus className="h-4 w-4" /> Nova campanha
          </Button>
        }
      />

      {campanhas === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {campanhas?.length === 0 && (
        <EmptyState
          title="Nenhuma campanha criada ainda"
          description="Crie sua primeira campanha escolhendo prêmios, quantidade de cotas e valor."
          action={
            <Button className="mt-2" onClick={() => router.push('/admin/campanhas/novo')}>
              <IconPlus className="h-4 w-4" /> Criar campanha
            </Button>
          }
        />
      )}

      {campanhas && campanhas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.valor}
              type="button"
              onClick={() => setFiltroStatus(filtro.valor)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filtroStatus === filtro.valor
                  ? 'border-accent-ink bg-accent/20 text-accent-ink'
                  : 'border-line bg-white text-night hover:border-accent-ink/60'
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      )}

      {campanhas && campanhas.length > 0 && campanhasFiltradas.length === 0 && (
        <EmptyState
          title="Nenhuma campanha neste filtro"
          description="Tente outro status ou volte para “Todas”."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campanhasFiltradas.map((campanha) => {
          const fotoPremio = campanha.premioIds.map((id) => premiosPorId.get(id)?.fotoUrl).find(Boolean);
          const foto = campanha.fotoUrl ?? fotoPremio;
          // Campanha liberada (ou já liberada para sorteio) e não removida vai direto para
          // o sorteio: não há mais conteúdo para editar, só confirmar pagamento e liberar cotas.
          const destino =
            (campanha.status === 'LIBERADA' || campanha.status === 'LIBERADA_PARA_SORTEIO') &&
            !campanha.removidaEm
              ? `/admin/campanhas/${campanha.id}/sorteio`
              : `/admin/campanhas/${campanha.id}`;

          return (
            <button key={campanha.id} className="text-left" onClick={() => router.push(destino)}>
              <Card
                className={`flex flex-col gap-3 transition hover:border-night/30 ${
                  campanha.removidaEm ? 'opacity-60' : ''
                }`}
              >
                <div className="relative -mx-5 -mt-5 aspect-square w-[calc(100%+2.5rem)] overflow-hidden bg-mist">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem da campanha ou do prêmio, vem da API ou de host externo
                    <img
                      src={urlArquivoApi(foto)}
                      alt={campanha.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <IconGift className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-night">{campanha.nome}</p>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <Badge tone={TOM_STATUS[campanha.status] ?? 'neutral'}>
                      {formatarStatusCampanha(campanha.status)}
                    </Badge>
                    {campanha.removidaEm && <Badge tone="danger">Removida</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted line-clamp-2">{campanha.descricao}</p>
                <div className="flex justify-between text-xs text-muted">
                  <span>{campanha.quantidadeCotas} cotas</span>
                  <span>{formatarMoeda(campanha.valorCota)} / cota</span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

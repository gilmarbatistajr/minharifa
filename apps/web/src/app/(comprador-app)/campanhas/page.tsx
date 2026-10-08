'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { IconGift } from '../../../components/ui/icons';
import { campanhasApi, urlArquivoApi, type Campanha } from '../../../lib/api';
import { formatarMoeda, formatarStatusCampanha } from '../../../lib/format';
import { useSessaoComprador } from '../../../lib/auth';

// Mesmo status e mesma legenda exibidos ao administrador (campanha.status,
// não statusVendas) — o comprador só chega a ver uma campanha depois que ela
// é lançada para o grupo dele (campanhasApi.visiveis já filtra por grupoId).
const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  NOVO: 'neutral',
  AGUARDANDO_LIBERACAO: 'warning',
  LIBERADA: 'accent',
  LIBERADA_PARA_SORTEIO: 'warning',
  FINALIZADA: 'neutral',
};

// Só existem 3 status possíveis nessa lista (uma campanha só fica visível ao
// comprador depois de lançada para o grupo dele — nunca aparece NOVO nem
// AGUARDANDO_LIBERACAO aqui).
type FiltroStatus = 'TODAS' | 'LIBERADA' | 'LIBERADA_PARA_SORTEIO' | 'FINALIZADA';

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: 'TODAS', label: 'Todas' },
  { valor: 'LIBERADA', label: 'Vendas abertas' },
  { valor: 'LIBERADA_PARA_SORTEIO', label: 'Vendas encerradas' },
  { valor: 'FINALIZADA', label: 'Finalizadas' },
];

export default function ListaCampanhasPage() {
  const { sessao } = useSessaoComprador();
  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODAS');

  useEffect(() => {
    if (!sessao) return;
    campanhasApi.visiveis(sessao.token).then(setCampanhas);
  }, [sessao]);

  // "Finalizadas" é um balde à parte, igual "Removidas" no admin: por padrão
  // (em qualquer filtro, inclusive "Todas") campanhas finalizadas ficam
  // ocultas — só aparecem quando esse filtro é escolhido explicitamente.
  const campanhasFiltradas = (campanhas ?? []).filter((campanha) => {
    if (filtroStatus === 'FINALIZADA') return campanha.status === 'FINALIZADA';
    if (campanha.status === 'FINALIZADA') return false;
    return filtroStatus === 'TODAS' || campanha.status === filtroStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Seu grupo" title="Campanhas" description="Cotas disponíveis para o grupo ao qual você tem acesso." />

      {campanhas === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {campanhas?.length === 0 && (
        <EmptyState
          title="Nenhuma campanha por aqui ainda"
          description="Assim que o administrador do grupo lançar uma campanha, ela aparece nesta lista."
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
          // Com as vendas encerradas (todas as cotas pagas, aguardando o
          // sorteio ser realizado) não há mais nada para o comprador fazer
          // nessa campanha — ela continua listada, mas não dá pra abrir.
          const podeAbrir = campanha.status !== 'LIBERADA_PARA_SORTEIO';

          const conteudo = (
            <Card
              className={`flex flex-col gap-3 transition ${podeAbrir ? 'hover:border-night/30' : 'opacity-70'}`}
            >
              <div className="relative -mx-5 -mt-5 aspect-square w-[calc(100%+2.5rem)] overflow-hidden bg-mist">
                {campanha.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- imagem da campanha, vem da API
                  <img
                    src={urlArquivoApi(campanha.fotoUrl)}
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
                <Badge tone={TOM_STATUS[campanha.status] ?? 'neutral'}>
                  {formatarStatusCampanha(campanha.status)}
                </Badge>
              </div>
              <p className="text-xs text-muted line-clamp-2">{campanha.descricao}</p>
              <div className="flex justify-between text-xs text-muted">
                <span>{campanha.quantidadeCotas} cotas</span>
                <span>{formatarMoeda(campanha.valorCota)} / cota</span>
              </div>
              {!podeAbrir && (
                <p className="text-xs text-muted">Vendas encerradas — aguardando o sorteio ser realizado.</p>
              )}
            </Card>
          );

          return podeAbrir ? (
            <Link key={campanha.id} href={`/campanhas/${campanha.id}`}>
              {conteudo}
            </Link>
          ) : (
            <div key={campanha.id}>{conteudo}</div>
          );
        })}
      </div>
    </div>
  );
}

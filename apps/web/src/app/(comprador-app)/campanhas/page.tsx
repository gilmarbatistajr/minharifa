'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { IconChevronRight } from '../../../components/ui/icons';
import { campanhasApi, type Campanha } from '../../../lib/api';
import { formatarData, formatarMoeda, formatarStatusCampanha } from '../../../lib/format';
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

export default function ListaCampanhasPage() {
  const { sessao } = useSessaoComprador();
  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null);

  useEffect(() => {
    if (!sessao) return;
    campanhasApi.visiveis(sessao.token).then(setCampanhas);
  }, [sessao]);

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

      <div className="grid gap-4 sm:grid-cols-2">
        {campanhas?.map((campanha) => {
          // Com as vendas encerradas (todas as cotas pagas, aguardando o
          // sorteio ser realizado) não há mais nada para o comprador fazer
          // nessa campanha — ela continua listada, mas não dá pra abrir.
          const podeAbrir = campanha.status !== 'LIBERADA_PARA_SORTEIO';

          const conteudo = (
            <Card
              className={`flex flex-col gap-3 transition ${podeAbrir ? 'hover:border-night/30' : 'opacity-70'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <Badge tone={TOM_STATUS[campanha.status] ?? 'neutral'}>
                  {formatarStatusCampanha(campanha.status)}
                </Badge>
                {podeAbrir && <IconChevronRight className="h-5 w-5 text-muted" />}
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Valor da cota</p>
                <p className="font-display text-2xl text-night">{formatarMoeda(campanha.valorCota)}</p>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{campanha.quantidadeCotas} cotas</span>
                <span>{campanha.dataRealizacao && `Sorteio em ${formatarData(campanha.dataRealizacao)}`}</span>
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

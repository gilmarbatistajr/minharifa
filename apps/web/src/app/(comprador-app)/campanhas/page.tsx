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
import { formatarData, formatarMoeda, formatarStatusVendasCampanha } from '../../../lib/format';
import { useSessaoComprador } from '../../../lib/auth';

const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  VENDAS_ABERTAS: 'accent',
  AGUARDANDO_ABERTURA: 'neutral',
  VENDAS_ENCERRADAS: 'warning',
  COTAS_ESGOTADAS: 'warning',
  FINALIZADO: 'neutral',
  CANCELADO: 'danger',
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
        {campanhas?.map((campanha) => (
          <Link key={campanha.id} href={`/campanhas/${campanha.id}`}>
            <Card className="flex flex-col gap-3 transition hover:border-night/30">
              <div className="flex items-start justify-between gap-2">
                <Badge tone={TOM_STATUS[campanha.statusVendas] ?? 'neutral'}>
                  {formatarStatusVendasCampanha(campanha.statusVendas)}
                </Badge>
                <IconChevronRight className="h-5 w-5 text-muted" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Valor da cota</p>
                <p className="font-display text-2xl text-night">{formatarMoeda(campanha.valorCota)}</p>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{campanha.quantidadeCotas} cotas</span>
                <span>{campanha.dataRealizacao && `Sorteio em ${formatarData(campanha.dataRealizacao)}`}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

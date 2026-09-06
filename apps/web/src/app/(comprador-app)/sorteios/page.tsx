'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { IconChevronRight } from '../../../components/ui/icons';
import { gruposApi, type Sorteio } from '../../../lib/api';
import { formatarData, formatarMoeda, formatarStatusSorteio } from '../../../lib/format';
import { useSessaoComprador } from '../../../lib/auth';

const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  VENDAS_ABERTAS: 'accent',
  AGUARDANDO_ABERTURA: 'neutral',
  VENDAS_ENCERRADAS: 'warning',
  COTAS_ESGOTADAS: 'warning',
  FINALIZADO: 'neutral',
  CANCELADO: 'danger',
};

export default function ListaSorteiosPage() {
  const { sessao } = useSessaoComprador();
  const [sorteios, setSorteios] = useState<Sorteio[] | null>(null);

  useEffect(() => {
    if (!sessao) return;
    gruposApi.sorteiosVisiveis(sessao.token).then(setSorteios);
  }, [sessao]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Seu grupo" title="Sorteios" description="Cotas disponíveis para o grupo ao qual você tem acesso." />

      {sorteios === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {sorteios?.length === 0 && (
        <EmptyState
          title="Nenhum sorteio por aqui ainda"
          description="Assim que o administrador do grupo publicar um sorteio, ele aparece nesta lista."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorteios?.map((sorteio) => (
          <Link key={sorteio.id} href={`/sorteios/${sorteio.id}`}>
            <Card className="flex flex-col gap-3 transition hover:border-night/30">
              <div className="flex items-start justify-between gap-2">
                <Badge tone={TOM_STATUS[sorteio.status] ?? 'neutral'}>
                  {formatarStatusSorteio(sorteio.status)}
                </Badge>
                <IconChevronRight className="h-5 w-5 text-muted" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Valor da cota</p>
                <p className="font-display text-2xl text-night">{formatarMoeda(sorteio.valorCota)}</p>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{sorteio.quantidadeCotas} cotas</span>
                <span>Sorteio em {formatarData(sorteio.dataRealizacao)}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

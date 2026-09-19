'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconPlus } from '../../../../components/ui/icons';
import { campanhasApi, type Campanha } from '../../../../lib/api';
import { formatarMoeda, formatarStatusCampanha } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  NOVO: 'neutral',
  AGUARDANDO_LIBERACAO: 'warning',
  LIBERADA: 'accent',
  FINALIZADA: 'neutral',
};

export default function ListaCampanhasPage() {
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();
  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null);

  useEffect(() => {
    if (!sessao) return;
    campanhasApi.listar(sessao.token).then(setCampanhas);
  }, [sessao]);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campanhas?.map((campanha) => (
          <button
            key={campanha.id}
            className="text-left"
            onClick={() => router.push(`/admin/campanhas/${campanha.id}`)}
          >
            <Card className="flex flex-col gap-3 transition hover:border-night/30">
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
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

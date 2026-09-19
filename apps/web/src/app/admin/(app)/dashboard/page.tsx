'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { RankingCard } from '../../../../components/ui/RankingCard';
import { administradoresApi, type VisaoGeralDashboard, type RankingItem } from '../../../../lib/api';
import { formatarStatusVendasCampanha } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

export default function DashboardPage() {
  const { sessao } = useSessaoAdministrador();
  const [dados, setDados] = useState<VisaoGeralDashboard | null>(null);
  const [rankingCotas, setRankingCotas] = useState<RankingItem[] | null>(null);
  const [rankingVencedores, setRankingVencedores] = useState<RankingItem[] | null>(null);

  useEffect(() => {
    if (!sessao) return;
    administradoresApi.dashboard(sessao.token).then(setDados);
    administradoresApi.rankingCotasCompradas(sessao.token).then(setRankingCotas);
    administradoresApi.rankingVencedores(sessao.token).then(setRankingVencedores);
  }, [sessao]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${sessao?.nome?.split(' ')[0] ?? ''}`}
        description="Acompanhe suas campanhas ativas e o que precisa de atenção agora."
      />

      {dados === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {dados?.temCampanhas === false && (
        <EmptyState
          title="Seu painel está pronto"
          description="Cadastre um grupo de WhatsApp e um prêmio para começar a criar sua primeira campanha."
          action={
            <div className="mt-2 flex gap-2">
              <Link href="/admin/grupos">
                <Button variant="secondary">Criar grupo</Button>
              </Link>
              <Link href="/admin/premios">
                <Button>Cadastrar prêmio</Button>
              </Link>
            </div>
          }
        />
      )}

      {dados && dados.campanhas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.campanhas.map((campanha) => (
            <Card key={campanha.campanhaId} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Badge tone="accent">{formatarStatusVendasCampanha(campanha.status)}</Badge>
                {campanha.encerrandoEm24h && <Badge tone="warning">Encerra em 24h</Badge>}
                {campanha.aguardandoResultado && <Badge tone="warning">Aguardando resultado</Badge>}
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Vendido</p>
                <p className="font-display text-3xl text-night">{campanha.percentualVendido}%</p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${campanha.percentualVendido}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {dados?.temCampanhas && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RankingCard titulo="🏆 Quem mais comprou cotas" itens={rankingCotas} rotuloQuantidade="cotas" />
          <RankingCard titulo="🎉 Quem mais ganhou" itens={rankingVencedores} rotuloQuantidade="vitórias" />
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconCheck } from '../../../../components/ui/icons';
import { notificacoesApi, ApiError, type ListaNotificacoes, type Notificacao } from '../../../../lib/api';
import { useSessaoAdministrador } from '../../../../lib/auth';
import { formatarDataHora } from '../../../../lib/format';

const INTERVALO_ATUALIZACAO_MS = 30_000;

/** Avisa o layout para atualizar o contador do menu sem esperar o próximo ciclo. */
function avisarLayout() {
  window.dispatchEvent(new Event('notificacoes:atualizadas'));
}

export default function NotificacoesPage() {
  const { sessao } = useSessaoAdministrador();
  const token = sessao?.token;
  const [lista, setLista] = useState<ListaNotificacoes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const recarregar = useCallback(async () => {
    if (!token) return;
    try {
      setLista(await notificacoesApi.listar(token));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as notificações.');
    }
  }, [token]);

  useEffect(() => {
    recarregar();
    const intervalo = setInterval(recarregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [recarregar]);

  async function marcarLida(notificacao: Notificacao) {
    if (!token || notificacao.lidaEm) return;
    try {
      await notificacoesApi.marcarLida(token, notificacao.id);
      await recarregar();
      avisarLayout();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível marcar como lida.');
    }
  }

  async function marcarTodasLidas() {
    if (!token) return;
    setMarcandoTodas(true);
    try {
      await notificacoesApi.marcarTodasLidas(token);
      await recarregar();
      avisarLayout();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível marcar as notificações como lidas.');
    } finally {
      setMarcandoTodas(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Avisos"
        title="Notificações"
        description="Vendas de cotas para confirmar e o andamento das suas campanhas."
        action={
          lista && lista.naoLidas > 0 ? (
            <Button variant="secondary" onClick={marcarTodasLidas} loading={marcandoTodas}>
              <IconCheck className="h-4 w-4" /> Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {lista === null && !erro && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {lista?.notificacoes.length === 0 && (
        <EmptyState
          title="Nenhuma notificação por enquanto"
          description="Você será avisado a cada nova venda de cota e quando uma campanha atingir 20%, 50%, 75%, 90% e 100% das cotas vendidas."
        />
      )}

      <div className="flex flex-col gap-3">
        {lista?.notificacoes.map((notificacao) => (
          <LinhaNotificacao key={notificacao.id} notificacao={notificacao} aoLer={() => marcarLida(notificacao)} />
        ))}
      </div>
    </div>
  );
}

function LinhaNotificacao({ notificacao, aoLer }: { notificacao: Notificacao; aoLer: () => void }) {
  const naoLida = !notificacao.lidaEm;
  const novaVenda = notificacao.tipo === 'NOVA_VENDA';

  return (
    <Card
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        naoLida ? 'border-accent/60 bg-accent/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${naoLida ? 'bg-accent' : 'bg-line'}`}
        />
        <div className="flex flex-col gap-1">
          <p className={`text-sm text-night ${naoLida ? 'font-semibold' : ''}`}>{notificacao.mensagem}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{formatarDataHora(notificacao.criadoEm)}</span>
            <Badge tone={novaVenda ? 'warning' : 'neutral'}>{novaVenda ? 'Nova venda' : 'Marco de vendas'}</Badge>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:ml-4">
        {notificacao.campanhaId && (
          <Link
            href={`/admin/campanhas/${notificacao.campanhaId}/sorteio`}
            onClick={aoLer}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-night transition hover:bg-mist"
          >
            {novaVenda ? 'Confirmar pagamento' : 'Ver campanha'}
          </Link>
        )}
        {naoLida && (
          <button
            type="button"
            onClick={aoLer}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-mist hover:text-night"
          >
            Marcar como lida
          </button>
        )}
      </div>
    </Card>
  );
}

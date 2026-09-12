'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { CheckboxField } from '../../../../../components/ui/Field';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Spinner } from '../../../../../components/ui/Spinner';
import { IconArrowLeft, IconCopy, IconWhatsapp } from '../../../../../components/ui/icons';
import {
  gruposApi,
  ApiError,
  type CompradorResumo,
  type ContagemSorteios,
  type DetalheGrupo,
} from '../../../../../lib/api';
import { useSessaoAdministrador } from '../../../../../lib/auth';

export default function DetalheGrupoPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();

  const [grupo, setGrupo] = useState<DetalheGrupo | null>(null);
  const [compradores, setCompradores] = useState<CompradorResumo[] | null>(null);
  const [contagem, setContagem] = useState<ContagemSorteios | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregarGrupo = useCallback(() => {
    if (!sessao) return;
    gruposApi.buscar(sessao.token, id).then(setGrupo);
  }, [sessao, id]);

  useEffect(() => {
    if (!sessao) return;
    recarregarGrupo();
    gruposApi.listarCompradores(sessao.token, id).then(setCompradores);
    gruposApi.contarSorteios(sessao.token, id).then(setContagem);
  }, [sessao, id, recarregarGrupo]);

  if (!grupo) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push('/admin/grupos')}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" /> Meus grupos
      </button>

      <PageHeader
        eyebrow="Grupo"
        title={grupo.nome}
        description={
          <span className="flex items-center gap-1.5">
            <IconWhatsapp className="h-3.5 w-3.5" /> {grupo.identificadorWhatsapp}
          </span>
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        <SecaoAgenteChatbot
          grupoId={id}
          token={sessao?.token}
          agenteChatbot={grupo.agenteChatbot}
          aoAtualizar={recarregarGrupo}
          aoErro={setErro}
        />

        <SecaoLinkConvite grupoId={id} token={sessao?.token} aoErro={setErro} />

        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Sorteios</p>
          {!contagem ? (
            <Spinner size={18} />
          ) : (
            <div className="mt-3 flex gap-6">
              <div>
                <p className="font-display text-3xl text-night">{contagem.emAndamento}</p>
                <p className="text-xs text-muted">em andamento</p>
              </div>
              <div>
                <p className="font-display text-3xl text-night">{contagem.finalizados}</p>
                <p className="text-xs text-muted">finalizados</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">
            Compradores ({compradores?.length ?? '...'})
          </p>
          {compradores === null && <Spinner size={18} />}
          {compradores?.length === 0 && (
            <EmptyState title="Nenhum comprador ainda" description="Compartilhe o link de convite no grupo." />
          )}
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {compradores?.map((comprador) => (
              <div key={comprador.id} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
                <span className="font-medium text-night">{comprador.nome}</span>
                <span className="font-mono text-xs text-muted">{comprador.telefone}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SecaoAgenteChatbot({
  grupoId,
  token,
  agenteChatbot,
  aoAtualizar,
  aoErro,
}: {
  grupoId: string;
  token?: string;
  agenteChatbot: DetalheGrupo['agenteChatbot'];
  aoAtualizar: () => void;
  aoErro: (mensagem: string) => void;
}) {
  const [carregando, setCarregando] = useState(false);

  async function executar(acao: () => Promise<unknown>) {
    setCarregando(true);
    try {
      await acao();
      aoAtualizar();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível atualizar o agente.');
    } finally {
      setCarregando(false);
    }
  }

  if (!agenteChatbot) {
    return (
      <Card className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Agente chatbot</p>
        <p className="text-sm text-muted">
          Ative o agente para avisar automaticamente o grupo sobre cotas restantes, novos sorteios
          e resultados.
        </p>
        <Button
          className="self-start"
          loading={carregando}
          onClick={() => token && executar(() => gruposApi.criarAgenteChatbot(token, grupoId))}
        >
          Adicionar agente chatbot
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Agente chatbot</p>
        <Badge tone={agenteChatbot.ativo ? 'accent' : 'neutral'}>
          {agenteChatbot.ativo ? 'Ativo' : 'Desativado'}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <CheckboxField
          label="Avisar cotas restantes"
          checked={agenteChatbot.avisaCotasRestantes}
          onChange={(e) =>
            token &&
            executar(() => gruposApi.configurarAvisos(token, grupoId, { avisaCotasRestantes: e.target.checked }))
          }
        />
        <CheckboxField
          label="Avisar novo sorteio"
          checked={agenteChatbot.avisaNovoSorteio}
          onChange={(e) =>
            token &&
            executar(() => gruposApi.configurarAvisos(token, grupoId, { avisaNovoSorteio: e.target.checked }))
          }
        />
        <CheckboxField
          label="Avisar resultado"
          checked={agenteChatbot.avisaResultado}
          onChange={(e) =>
            token && executar(() => gruposApi.configurarAvisos(token, grupoId, { avisaResultado: e.target.checked }))
          }
        />
      </div>

      {agenteChatbot.ativo && (
        <Button
          variant="secondary"
          className="self-start"
          loading={carregando}
          onClick={() => token && executar(() => gruposApi.desativarAgenteChatbot(token, grupoId))}
        >
          Desativar agente
        </Button>
      )}
    </Card>
  );
}

function SecaoLinkConvite({
  grupoId,
  token,
  aoErro,
}: {
  grupoId: string;
  token?: string;
  aoErro: (mensagem: string) => void;
}) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const link =
    codigo && typeof window !== 'undefined' ? `${window.location.origin}/cadastro?convite=${codigo}` : null;

  async function gerar() {
    if (!token) return;
    setCarregando(true);
    try {
      const resultado = await gruposApi.gerarLinkConvite(token, grupoId);
      setCodigo(resultado.codigo);
      setCopiado(false);
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível gerar o link de convite.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-wide text-muted">Link de convite</p>
      <p className="text-sm text-muted">Compartilhe este link no grupo para que novos compradores se cadastrem.</p>

      {link ? (
        <div className="flex flex-col gap-2">
          <div className="truncate rounded-lg bg-mist px-3 py-2 font-mono text-xs text-night">{link}</div>
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => {
              navigator.clipboard?.writeText(link);
              setCopiado(true);
            }}
          >
            <IconCopy className="h-4 w-4" /> {copiado ? 'Copiado!' : 'Copiar link'}
          </Button>
        </div>
      ) : (
        <Button className="self-start" loading={carregando} onClick={gerar}>
          Gerar link de convite
        </Button>
      )}
    </Card>
  );
}

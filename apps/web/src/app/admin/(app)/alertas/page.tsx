'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { CheckboxField, TextAreaField } from '../../../../components/ui/Field';
import { gruposApi, ApiError, type AlertaAutomaticoGrupo } from '../../../../lib/api';
import { useSessaoAdministrador } from '../../../../lib/auth';

export default function AlertasAutomaticosPage() {
  const { sessao } = useSessaoAdministrador();
  const [alertas, setAlertas] = useState<AlertaAutomaticoGrupo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    if (!sessao) return;
    gruposApi.listarAlertasAutomaticos(sessao.token).then(setAlertas);
  }, [sessao]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Automação"
        title="Alertas automáticos"
        description="Configure, para cada grupo com uma campanha ativa, quais avisos o agente chatbot envia automaticamente."
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {alertas === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {alertas?.length === 0 && (
        <EmptyState
          title="Nenhum grupo com campanha ativa"
          description="Assim que uma campanha for lançada para um grupo, ele aparece aqui para configurar os alertas."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {alertas?.map((alerta) => (
          <LinhaAlerta key={alerta.grupoId} alerta={alerta} token={sessao?.token} aoErro={setErro} />
        ))}
      </div>
    </div>
  );
}

interface RascunhoAlertas {
  avisa50PorCentoVendido: boolean;
  avisa80PorCentoVendido: boolean;
  avisa90PorCentoVendido: boolean;
  avisaNovaCampanha: boolean;
  avisaResultado: boolean;
  mensagem50PorCentoVendido: string;
  mensagem80PorCentoVendido: string;
  mensagem90PorCentoVendido: string;
  mensagemNovaCampanha: string;
  mensagemResultado: string;
}

function paraRascunho(agenteChatbot: NonNullable<AlertaAutomaticoGrupo['agenteChatbot']>): RascunhoAlertas {
  return {
    avisa50PorCentoVendido: agenteChatbot.avisa50PorCentoVendido,
    avisa80PorCentoVendido: agenteChatbot.avisa80PorCentoVendido,
    avisa90PorCentoVendido: agenteChatbot.avisa90PorCentoVendido,
    avisaNovaCampanha: agenteChatbot.avisaNovaCampanha,
    avisaResultado: agenteChatbot.avisaResultado,
    mensagem50PorCentoVendido: agenteChatbot.mensagem50PorCentoVendido ?? '',
    mensagem80PorCentoVendido: agenteChatbot.mensagem80PorCentoVendido ?? '',
    mensagem90PorCentoVendido: agenteChatbot.mensagem90PorCentoVendido ?? '',
    mensagemNovaCampanha: agenteChatbot.mensagemNovaCampanha ?? '',
    mensagemResultado: agenteChatbot.mensagemResultado ?? '',
  };
}

function LinhaAlerta({
  alerta,
  token,
  aoErro,
}: {
  alerta: AlertaAutomaticoGrupo;
  token?: string;
  aoErro: (mensagem: string) => void;
}) {
  const [rascunho, setRascunho] = useState<RascunhoAlertas | null>(
    alerta.agenteChatbot ? paraRascunho(alerta.agenteChatbot) : null,
  );
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizarCampo<C extends keyof RascunhoAlertas>(campo: C, valor: RascunhoAlertas[C]) {
    setRascunho((atual) => (atual ? { ...atual, [campo]: valor } : atual));
    setSalvo(false);
  }

  async function salvar() {
    if (!token || !rascunho) return;
    setSalvando(true);
    try {
      await gruposApi.configurarAvisos(token, alerta.grupoId, rascunho);
      setSalvo(true);
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível salvar os alertas.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-medium text-night">{alerta.nomeGrupo}</p>
        <p className="text-xs text-muted">Campanha ativa: {alerta.campanhaAtivaNome}</p>
      </div>

      {!rascunho ? (
        <p className="text-xs text-muted">Este grupo ainda não tem um agente chatbot configurado.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <BlocoAlerta
              label="50% das cotas vendidas"
              avisa={rascunho.avisa50PorCentoVendido}
              mensagem={rascunho.mensagem50PorCentoVendido}
              onMudarAvisa={(valor) => atualizarCampo('avisa50PorCentoVendido', valor)}
              onMudarMensagem={(valor) => atualizarCampo('mensagem50PorCentoVendido', valor)}
            />
            <BlocoAlerta
              label="80% das cotas vendidas"
              avisa={rascunho.avisa80PorCentoVendido}
              mensagem={rascunho.mensagem80PorCentoVendido}
              onMudarAvisa={(valor) => atualizarCampo('avisa80PorCentoVendido', valor)}
              onMudarMensagem={(valor) => atualizarCampo('mensagem80PorCentoVendido', valor)}
            />
            <BlocoAlerta
              label="90% das cotas vendidas"
              avisa={rascunho.avisa90PorCentoVendido}
              mensagem={rascunho.mensagem90PorCentoVendido}
              onMudarAvisa={(valor) => atualizarCampo('avisa90PorCentoVendido', valor)}
              onMudarMensagem={(valor) => atualizarCampo('mensagem90PorCentoVendido', valor)}
            />
            <BlocoAlerta
              label="Avisar nova campanha"
              avisa={rascunho.avisaNovaCampanha}
              mensagem={rascunho.mensagemNovaCampanha}
              onMudarAvisa={(valor) => atualizarCampo('avisaNovaCampanha', valor)}
              onMudarMensagem={(valor) => atualizarCampo('mensagemNovaCampanha', valor)}
            />
            <BlocoAlerta
              label="Avisar resultado"
              avisa={rascunho.avisaResultado}
              mensagem={rascunho.mensagemResultado}
              onMudarAvisa={(valor) => atualizarCampo('avisaResultado', valor)}
              onMudarMensagem={(valor) => atualizarCampo('mensagemResultado', valor)}
            />
          </div>

          <Button className="self-start" loading={salvando} onClick={salvar}>
            {salvo ? 'Salvo!' : 'Salvar'}
          </Button>
        </>
      )}
    </Card>
  );
}

function BlocoAlerta({
  label,
  avisa,
  mensagem,
  onMudarAvisa,
  onMudarMensagem,
}: {
  label: string;
  avisa: boolean;
  mensagem: string;
  onMudarAvisa: (valor: boolean) => void;
  onMudarMensagem: (valor: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <CheckboxField label={label} checked={avisa} onChange={(e) => onMudarAvisa(e.target.checked)} />
      <TextAreaField
        label="Mensagem"
        hint="Enviada automaticamente quando este alerta disparar."
        className="min-h-20 text-sm"
        value={mensagem}
        onChange={(e) => onMudarMensagem(e.target.value)}
      />
    </div>
  );
}

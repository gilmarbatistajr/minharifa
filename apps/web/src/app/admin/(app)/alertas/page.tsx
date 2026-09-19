'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Alert } from '../../../../components/ui/Alert';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { CheckboxField } from '../../../../components/ui/Field';
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

function LinhaAlerta({
  alerta,
  token,
  aoErro,
}: {
  alerta: AlertaAutomaticoGrupo;
  token?: string;
  aoErro: (mensagem: string) => void;
}) {
  const [agenteChatbot, setAgenteChatbot] = useState(alerta.agenteChatbot);
  const [carregando, setCarregando] = useState(false);

  async function atualizar(mudanca: { avisaCotasRestantes?: boolean; avisaNovaCampanha?: boolean; avisaResultado?: boolean }) {
    if (!token) return;
    setCarregando(true);
    try {
      await gruposApi.configurarAvisos(token, alerta.grupoId, mudanca);
      setAgenteChatbot((atual) => (atual ? { ...atual, ...mudanca } : atual));
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível atualizar o alerta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-medium text-night">{alerta.nomeGrupo}</p>
        <p className="text-xs text-muted">Campanha ativa: {alerta.campanhaAtivaNome}</p>
      </div>

      {!agenteChatbot ? (
        <p className="text-xs text-muted">Este grupo ainda não tem um agente chatbot configurado.</p>
      ) : (
        <div className={`flex flex-col gap-2 ${carregando ? 'opacity-60' : ''}`}>
          <CheckboxField
            label="Avisar cotas restantes"
            checked={agenteChatbot.avisaCotasRestantes}
            onChange={(e) => atualizar({ avisaCotasRestantes: e.target.checked })}
          />
          <CheckboxField
            label="Avisar nova campanha"
            checked={agenteChatbot.avisaNovaCampanha}
            onChange={(e) => atualizar({ avisaNovaCampanha: e.target.checked })}
          />
          <CheckboxField
            label="Avisar resultado"
            checked={agenteChatbot.avisaResultado}
            onChange={(e) => atualizar({ avisaResultado: e.target.checked })}
          />
        </div>
      )}
    </Card>
  );
}

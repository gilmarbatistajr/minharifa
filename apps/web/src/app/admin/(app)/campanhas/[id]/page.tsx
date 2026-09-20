'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Spinner } from '../../../../../components/ui/Spinner';
import { TextField, SelectField } from '../../../../../components/ui/Field';
import { IconArrowLeft, IconGift } from '../../../../../components/ui/icons';
import {
  campanhasApi,
  gruposApi,
  premiosApi,
  urlArquivoApi,
  ApiError,
  type Campanha,
  type Grupo,
  type Premio,
} from '../../../../../lib/api';
import { formatarData, formatarMoeda, formatarStatusCampanha, formatarStatusVendasCampanha } from '../../../../../lib/format';
import { useSessaoAdministrador } from '../../../../../lib/auth';

const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  NOVO: 'neutral',
  AGUARDANDO_LIBERACAO: 'warning',
  LIBERADA: 'accent',
  FINALIZADA: 'neutral',
};

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export default function DetalheCampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const recarregar = useCallback(() => {
    if (!sessao) return;
    campanhasApi.buscar(sessao.token, id).then(setCampanha);
    premiosApi.listar(sessao.token).then(setPremios);
  }, [sessao, id]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  async function marcarComoRevisada() {
    if (!sessao) return;
    setErro(null);
    setCarregando(true);
    try {
      await campanhasApi.marcarComoRevisada(sessao.token, id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível marcar a campanha como revisada.');
    } finally {
      setCarregando(false);
    }
  }

  async function remover() {
    if (!sessao) return;
    if (
      !window.confirm(
        'Remover esta campanha? Ela some das ações do dia a dia, mas continua visível na lista de campanhas — você pode restaurá-la depois.',
      )
    ) {
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      await campanhasApi.remover(sessao.token, id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível remover a campanha.');
    } finally {
      setCarregando(false);
    }
  }

  async function restaurar() {
    if (!sessao) return;
    setErro(null);
    setCarregando(true);
    try {
      await campanhasApi.restaurar(sessao.token, id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível restaurar a campanha.');
    } finally {
      setCarregando(false);
    }
  }

  if (!campanha) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  const podeFinalizar =
    campanha.status === 'LIBERADA' &&
    campanha.dataRealizacao !== null &&
    new Date(campanha.dataRealizacao) <= new Date();

  const premiosDaCampanha = premios?.filter((premio) => campanha.premioIds.includes(premio.id)) ?? [];
  const premioPrincipal = premiosDaCampanha[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push('/admin/campanhas')}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" /> Voltar para campanhas
      </button>

      <PageHeader
        eyebrow="Campanha"
        title={campanha.nome}
        description={
          <div className="flex flex-wrap gap-2">
            <Badge tone={TOM_STATUS[campanha.status] ?? 'neutral'}>{formatarStatusCampanha(campanha.status)}</Badge>
            {campanha.removidaEm && <Badge tone="danger">Removida</Badge>}
          </div>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push(`/admin/campanhas/${id}/sorteio`)}>
              Ver sorteio
            </Button>
            {campanha.removidaEm ? (
              <Button variant="secondary" loading={carregando} onClick={restaurar}>
                Restaurar campanha
              </Button>
            ) : (
              <Button variant="danger" loading={carregando} onClick={remover}>
                Remover campanha
              </Button>
            )}
          </div>
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {campanha.removidaEm && (
        <Alert tone="error">
          Esta campanha foi removida em {formatarData(campanha.removidaEm)}. Ela continua na lista de campanhas,
          mas as ações abaixo ficam bloqueadas até ser restaurada.
        </Alert>
      )}

      <Card className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-mist sm:w-32">
          {premioPrincipal?.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem vem da própria API ou de host externo
            <img
              src={urlArquivoApi(premioPrincipal.fotoUrl)}
              alt={premioPrincipal.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <IconGift className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {premioPrincipal ? premioPrincipal.nome : 'Sem prêmio associado'}
            </p>
            <p className="text-xs text-muted">
              A imagem exibida na campanha é a foto do prêmio associado.{' '}
              <button
                type="button"
                onClick={() => router.push('/admin/premios')}
                className="font-medium text-accent-ink hover:text-accent-ink-hover"
              >
                Editar em Prêmios
              </button>
              .
            </p>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm text-muted">{campanha.descricao}</p>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-mono text-xs uppercase text-muted">Cotas</p>
            <p className="text-night">{campanha.quantidadeCotas}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-muted">Valor da cota</p>
            <p className="text-night">{formatarMoeda(campanha.valorCota)}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-muted">Forma de venda</p>
            <p className="text-night">
              {campanha.formaVenda === 'ESCOLHA_NUMERO' ? 'Escolha de números' : 'Lote fechado'}
            </p>
          </div>
        </div>

        {campanha.grupoId && (
          <div className="grid grid-cols-2 gap-4 border-t border-line pt-3 text-sm sm:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase text-muted">Status de vendas</p>
              <p className="text-night">{formatarStatusVendasCampanha(campanha.statusVendas)}</p>
            </div>
            {campanha.dataAberturaVendas && (
              <div>
                <p className="font-mono text-xs uppercase text-muted">Abertura das vendas</p>
                <p className="text-night">{formatarData(campanha.dataAberturaVendas)}</p>
              </div>
            )}
            {campanha.dataRealizacao && (
              <div>
                <p className="font-mono text-xs uppercase text-muted">Data do sorteio</p>
                <p className="text-night">{formatarData(campanha.dataRealizacao)}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {!campanha.removidaEm && campanha.status === 'NOVO' && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Revise o conteúdo da campanha acima. Depois de marcada como revisada, ela fica pronta para ser
            lançada para um grupo.
          </p>
          <Button className="self-start" loading={carregando} onClick={marcarComoRevisada}>
            Marcar como revisada
          </Button>
        </Card>
      )}

      {!campanha.removidaEm && campanha.status === 'AGUARDANDO_LIBERACAO' && (
        <FormularioLancar
          campanhaId={id}
          token={sessao?.token}
          aoConcluir={recarregar}
          aoErro={setErro}
        />
      )}

      {!campanha.removidaEm && podeFinalizar && (
        <FormularioFinalizar campanhaId={id} token={sessao?.token} aoConcluir={recarregar} aoErro={setErro} />
      )}

      {campanha.status === 'FINALIZADA' && campanha.cotaVencedoraNumero !== null && (
        <Card className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Vencedor</p>
          <p className="text-sm text-night">Cota nº {campanha.cotaVencedoraNumero}</p>
        </Card>
      )}
    </div>
  );
}

function FormularioLancar({
  campanhaId,
  token,
  aoConcluir,
  aoErro,
}: {
  campanhaId: string;
  token?: string;
  aoConcluir: () => void;
  aoErro: (mensagem: string) => void;
}) {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [grupoId, setGrupoId] = useState('');
  const [dataAberturaVendas, setDataAberturaVendas] = useState(daquiA(0));
  const [dataEncerramentoVendas, setDataEncerramentoVendas] = useState(daquiA(30));
  const [dataRealizacao, setDataRealizacao] = useState(daquiA(31));
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) return;
    gruposApi.listar(token).then((lista) => {
      setGrupos(lista);
      if (lista.length > 0) setGrupoId(lista[0].id);
    });
  }, [token]);

  async function lancar(evento: FormEvent) {
    evento.preventDefault();
    if (!token || !grupoId) return;
    setEnviando(true);
    try {
      await gruposApi.lancarCampanha(token, grupoId, campanhaId, {
        dataAberturaVendas: new Date(dataAberturaVendas).toISOString(),
        dataEncerramentoVendas: new Date(dataEncerramentoVendas).toISOString(),
        dataRealizacao: new Date(dataRealizacao).toISOString(),
      });
      aoConcluir();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível lançar a campanha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm font-medium text-night">Lançar campanha</p>
      <p className="text-xs text-muted">
        Escolha o grupo que vai receber esta campanha e defina as datas de venda.
      </p>

      {grupos === null && (
        <div className="flex justify-center py-6 text-muted">
          <Spinner size={18} />
        </div>
      )}

      {grupos?.length === 0 && (
        <Alert tone="error">Cadastre um grupo de WhatsApp antes de lançar uma campanha.</Alert>
      )}

      {grupos && grupos.length > 0 && (
        <form onSubmit={lancar} className="flex flex-col gap-4">
          <SelectField label="Grupo" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </SelectField>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Abertura das vendas"
              type="date"
              required
              value={dataAberturaVendas}
              onChange={(e) => setDataAberturaVendas(e.target.value)}
            />
            <TextField
              label="Encerramento das vendas"
              type="date"
              required
              value={dataEncerramentoVendas}
              onChange={(e) => setDataEncerramentoVendas(e.target.value)}
            />
            <TextField
              label="Data do sorteio"
              type="date"
              required
              value={dataRealizacao}
              onChange={(e) => setDataRealizacao(e.target.value)}
            />
          </div>

          <Button type="submit" loading={enviando} className="self-start">
            Lançar campanha
          </Button>
        </form>
      )}
    </Card>
  );
}

function FormularioFinalizar({
  campanhaId,
  token,
  aoConcluir,
  aoErro,
}: {
  campanhaId: string;
  token?: string;
  aoConcluir: () => void;
  aoErro: (mensagem: string) => void;
}) {
  const [cotaVencedoraNumero, setCotaVencedoraNumero] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (!token) return;
    const numero = Number(cotaVencedoraNumero);
    if (!numero || numero < 1) {
      aoErro('Informe o número da cota vencedora.');
      return;
    }
    setEnviando(true);
    try {
      await campanhasApi.finalizar(token, campanhaId, numero);
      aoConcluir();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível finalizar a campanha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-night">Finalizar campanha</p>
      <p className="text-xs text-muted">A data do sorteio já passou. Informe o número da cota vencedora.</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <TextField
          label="Número da cota vencedora"
          type="number"
          min={1}
          value={cotaVencedoraNumero}
          onChange={(e) => setCotaVencedoraNumero(e.target.value)}
          className="max-w-[180px]"
        />
        <Button loading={enviando} onClick={confirmar}>
          Confirmar vencedor
        </Button>
      </div>
    </Card>
  );
}

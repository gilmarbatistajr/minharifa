'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card, TicketCard } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Spinner } from '../../../../components/ui/Spinner';
import { campanhasApi, ApiError, type CotaResumo, type Campanha } from '../../../../lib/api';
import { formatarMoeda } from '../../../../lib/format';
import { useSessaoComprador } from '../../../../lib/auth';

const LOTES_PRESET = [5, 10, 15, 20, 25, 30];
const QUANTIDADE_LOTE_PADRAO = 5;

export default function DetalheCampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoComprador();
  const router = useRouter();

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [cotas, setCotas] = useState<CotaResumo[] | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [quantidadeLote, setQuantidadeLote] = useState(QUANTIDADE_LOTE_PADRAO);

  const [erro, setErro] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);

  async function carregar() {
    if (!sessao) return;
    const [campanhas, mapaCotas] = await Promise.all([
      campanhasApi.visiveis(sessao.token),
      campanhasApi.listarCotas(sessao.token, id),
    ]);
    setCampanha(campanhas.find((c) => c.id === id) ?? null);
    setCotas(mapaCotas);
    setCarregandoDados(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao, id]);

  const minhasCotasReservadas = useMemo(
    () => cotas?.filter((cota) => cota.minhaCota && cota.status === 'RESERVADA').map((cota) => cota.numero) ?? [],
    [cotas],
  );

  function alternarSelecao(numero: number) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(numero)) {
        proximo.delete(numero);
      } else {
        proximo.add(numero);
      }
      return proximo;
    });
  }

  function ajustarQuantidadeLote(delta: number) {
    setQuantidadeLote((atual) => Math.max(1, atual + delta));
  }

  async function confirmarReservaManual() {
    if (!sessao) return;
    if (selecionados.size === 0) {
      setErro('Selecione pelo menos um número disponível.');
      return;
    }
    setErro(null);
    setReservando(true);
    try {
      await campanhasApi.reservarLote(sessao.token, id, { numeros: Array.from(selecionados) });
      setSelecionados(new Set());
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar as cotas.');
    } finally {
      setReservando(false);
    }
  }

  async function confirmarReservaLote() {
    if (!sessao) return;
    setErro(null);
    setReservando(true);
    try {
      await campanhasApi.reservarLote(sessao.token, id, { quantidadeAleatoria: quantidadeLote });
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar as cotas.');
    } finally {
      setReservando(false);
    }
  }

  function irParaPagamento() {
    if (!campanha) return;
    const parametros = new URLSearchParams({
      numeros: minhasCotasReservadas.join(','),
      telefoneSuporte: campanha.telefoneSuporte,
      nomeCampanha: campanha.nome,
    });
    router.push(`/campanhas/${id}/pagamento?${parametros.toString()}`);
  }

  if (carregandoDados) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  const formaVenda = campanha?.formaVenda ?? 'ESCOLHA_NUMERO';
  const mapaInterativo = formaVenda === 'ESCOLHA_NUMERO';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Escolha sua cota" title={campanha?.nome ?? 'Campanha'} />

      {campanha && (
        <TicketCard tone="night">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Valor da cota</p>
          <p className="mt-1 font-display text-3xl text-white">{formatarMoeda(campanha.valorCota)}</p>
          <p className="mt-2 text-sm text-white/70">{campanha.quantidadeCotas} números disponíveis no total.</p>
        </TicketCard>
      )}

      {erro && <Alert tone="error">{erro}</Alert>}

      {minhasCotasReservadas.length > 0 && (
        <Card className="flex flex-col gap-3 border-accent-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-night">
              Você reservou {minhasCotasReservadas.length}{' '}
              {minhasCotasReservadas.length === 1 ? 'cota' : 'cotas'}
            </p>
            <p className="font-mono text-xs text-muted">
              Nº {minhasCotasReservadas.slice().sort((a, b) => a - b).join(', ')}
            </p>
          </div>
          <Button onClick={irParaPagamento}>Ir para pagamento</Button>
        </Card>
      )}

      {formaVenda === 'ESCOLHA_NUMERO' ? (
        <Card className="flex flex-col gap-4">
          <p className="text-xs text-muted">
            Toque nos números disponíveis para selecionar {selecionados.size > 0 && `(${selecionados.size} selecionado${selecionados.size > 1 ? 's' : ''})`}.
          </p>

          <Button onClick={confirmarReservaManual} loading={reservando} fullWidth>
            {`Reservar ${selecionados.size || ''} cota${selecionados.size === 1 ? '' : 's'}`.trim()}
          </Button>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Escolha a quantidade do lote</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LOTES_PRESET.map((quantidade) => (
              <button
                key={quantidade}
                type="button"
                onClick={() => setQuantidadeLote(quantidade)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  quantidadeLote === quantidade
                    ? 'border-accent-ink bg-accent text-ink'
                    : 'border-line bg-white text-night hover:border-accent-ink'
                }`}
              >
                {quantidade}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => ajustarQuantidadeLote(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg font-semibold text-night hover:border-accent-ink"
              aria-label="Diminuir 1 cota"
            >
              −
            </button>
            <p className="font-mono text-2xl font-semibold text-night">{quantidadeLote}</p>
            <button
              type="button"
              onClick={() => ajustarQuantidadeLote(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg font-semibold text-night hover:border-accent-ink"
              aria-label="Aumentar 1 cota"
            >
              +
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Escolhemos {quantidadeLote} número{quantidadeLote === 1 ? '' : 's'} aleatório{quantidadeLote === 1 ? '' : 's'} entre os disponíveis.
          </p>

          <Button onClick={confirmarReservaLote} loading={reservando} fullWidth>
            {`Sortear e reservar ${quantidadeLote} cota${quantidadeLote === 1 ? '' : 's'}`}
          </Button>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
          {mapaInterativo && <LegendaItem cor="bg-white border border-line" label="Disponível" />}
          {mapaInterativo && <LegendaItem cor="bg-accent" label="Selecionada" />}
          <LegendaItem cor="bg-accent-ink/15" label="Sua reserva" />
          <LegendaItem cor="bg-mist" label="Indisponível" />
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
          {cotas?.map((cota) => (
            <BotaoCota
              key={cota.numero}
              cota={cota}
              selecionada={selecionados.has(cota.numero)}
              interativo={mapaInterativo}
              onClick={() => mapaInterativo && cota.status === 'DISPONIVEL' && alternarSelecao(cota.numero)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${cor}`} />
      {label}
    </span>
  );
}

function BotaoCota({
  cota,
  selecionada,
  interativo,
  onClick,
}: {
  cota: CotaResumo;
  selecionada: boolean;
  interativo: boolean;
  onClick: () => void;
}) {
  const disponivel = interativo && cota.status === 'DISPONIVEL';

  let classe = 'bg-mist text-muted cursor-not-allowed';
  if (cota.minhaCota && cota.status === 'RESERVADA') {
    classe = 'bg-accent-ink/15 text-accent-ink border border-accent-ink/40 cursor-default';
  } else if (cota.minhaCota && cota.status === 'PAGA') {
    classe = 'bg-night text-white cursor-default';
  } else if (disponivel && selecionada) {
    classe = 'bg-accent text-ink border border-accent-ink';
  } else if (disponivel) {
    classe = 'bg-white text-night border border-line hover:border-accent-ink cursor-pointer';
  } else if (!interativo && cota.status === 'DISPONIVEL') {
    classe = 'bg-white text-night border border-line cursor-default';
  }

  return (
    <button
      type="button"
      disabled={!disponivel}
      onClick={onClick}
      className={`flex aspect-square items-center justify-center rounded-lg font-mono text-xs font-medium transition ${classe}`}
      title={cota.minhaCota ? 'Sua cota' : undefined}
    >
      {cota.numero}
    </button>
  );
}

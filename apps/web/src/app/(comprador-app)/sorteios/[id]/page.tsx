'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card, TicketCard } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { TextField } from '../../../../components/ui/Field';
import { Spinner } from '../../../../components/ui/Spinner';
import { gruposApi, sorteiosApi, ApiError, type CotaResumo, type Sorteio } from '../../../../lib/api';
import { formatarMoeda } from '../../../../lib/format';
import { useSessaoComprador } from '../../../../lib/auth';

type ModoSelecao = 'manual' | 'aleatorio';

export default function DetalheSorteioPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoComprador();
  const router = useRouter();

  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [cotas, setCotas] = useState<CotaResumo[] | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [modo, setModo] = useState<ModoSelecao>('manual');
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [quantidadeAleatoria, setQuantidadeAleatoria] = useState('5');

  const [erro, setErro] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);

  async function carregar() {
    if (!sessao) return;
    const [sorteios, mapaCotas] = await Promise.all([
      gruposApi.sorteiosVisiveis(sessao.token),
      sorteiosApi.listarCotas(sessao.token, id),
    ]);
    setSorteio(sorteios.find((s) => s.id === id) ?? null);
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

  async function confirmarReserva() {
    if (!sessao) return;
    setErro(null);
    setReservando(true);
    try {
      if (modo === 'manual') {
        if (selecionados.size === 0) {
          setErro('Selecione pelo menos um número disponível.');
          return;
        }
        await sorteiosApi.reservarLote(sessao.token, id, { numeros: Array.from(selecionados) });
      } else {
        const quantidade = Number(quantidadeAleatoria);
        if (!quantidade || quantidade < 1) {
          setErro('Informe uma quantidade válida.');
          return;
        }
        await sorteiosApi.reservarLote(sessao.token, id, { quantidadeAleatoria: quantidade });
      }
      setSelecionados(new Set());
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar as cotas.');
    } finally {
      setReservando(false);
    }
  }

  function irParaPagamento() {
    const parametros = new URLSearchParams({ numeros: minhasCotasReservadas.join(',') });
    router.push(`/sorteios/${id}/pagamento?${parametros.toString()}`);
  }

  if (carregandoDados) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Escolha sua cota" title={sorteio?.nome ?? 'Sorteio'} />

      {sorteio && (
        <TicketCard tone="night">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Valor da cota</p>
          <p className="mt-1 font-display text-3xl text-white">{formatarMoeda(sorteio.valorCota)}</p>
          <p className="mt-2 text-sm text-white/70">{sorteio.quantidadeCotas} números disponíveis no total.</p>
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

      <Card className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModo('manual')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              modo === 'manual' ? 'border-accent-ink bg-accent text-ink' : 'border-line bg-white text-night'
            }`}
          >
            Escolher números
          </button>
          <button
            type="button"
            onClick={() => setModo('aleatorio')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              modo === 'aleatorio' ? 'border-accent-ink bg-accent text-ink' : 'border-line bg-white text-night'
            }`}
          >
            Comprar lote aleatório
          </button>
        </div>

        {modo === 'manual' ? (
          <p className="text-xs text-muted">
            Toque nos números disponíveis para selecionar {selecionados.size > 0 && `(${selecionados.size} selecionado${selecionados.size > 1 ? 's' : ''})`}.
          </p>
        ) : (
          <div className="flex items-end gap-3">
            <TextField
              label="Quantidade de cotas"
              type="number"
              min={1}
              value={quantidadeAleatoria}
              onChange={(e) => setQuantidadeAleatoria(e.target.value)}
              className="max-w-[140px]"
            />
            <p className="pb-3 text-xs text-muted">
              Escolhemos números aleatórios entre os disponíveis.
            </p>
          </div>
        )}

        <Button onClick={confirmarReserva} loading={reservando} fullWidth>
          {modo === 'manual'
            ? `Reservar ${selecionados.size || ''} cota${selecionados.size === 1 ? '' : 's'}`.trim()
            : `Sortear e reservar ${quantidadeAleatoria || ''} cota${Number(quantidadeAleatoria) === 1 ? '' : 's'}`}
        </Button>
      </Card>

      {modo === 'manual' && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
            <LegendaItem cor="bg-white border border-line" label="Disponível" />
            <LegendaItem cor="bg-accent" label="Selecionada" />
            <LegendaItem cor="bg-accent-ink/15" label="Sua reserva" />
            <LegendaItem cor="bg-mist" label="Indisponível" />
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {cotas?.map((cota) => (
              <BotaoCota
                key={cota.numero}
                cota={cota}
                selecionada={selecionados.has(cota.numero)}
                onClick={() => cota.status === 'DISPONIVEL' && alternarSelecao(cota.numero)}
              />
            ))}
          </div>
        </Card>
      )}
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
  onClick,
}: {
  cota: CotaResumo;
  selecionada: boolean;
  onClick: () => void;
}) {
  const disponivel = cota.status === 'DISPONIVEL';

  let classe = 'bg-mist text-muted cursor-not-allowed';
  if (cota.minhaCota && cota.status === 'RESERVADA') {
    classe = 'bg-accent-ink/15 text-accent-ink border border-accent-ink/40 cursor-default';
  } else if (cota.minhaCota && cota.status === 'PAGA') {
    classe = 'bg-night text-white cursor-default';
  } else if (disponivel && selecionada) {
    classe = 'bg-accent text-ink border border-accent-ink';
  } else if (disponivel) {
    classe = 'bg-white text-night border border-line hover:border-accent-ink cursor-pointer';
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

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
  const [loteStaged, setLoteStaged] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const formaVenda = campanha?.formaVenda ?? 'ESCOLHA_NUMERO';
  const mapaInterativo = formaVenda === 'ESCOLHA_NUMERO';
  // Sem um máximo configurado na campanha, o teto de cotas por compra é o
  // total de cotas dela — nunca é permitido comprar mais do que isso.
  const quantidadeMaximaPorCompra = campanha
    ? campanha.quantidadeMaximaPorCompra ?? campanha.quantidadeCotas
    : null;

  async function carregar() {
    if (!sessao) return null;
    const [campanhas, mapaCotas] = await Promise.all([
      campanhasApi.visiveis(sessao.token),
      campanhasApi.listarCotas(sessao.token, id),
    ]);
    const campanhaAtual = campanhas.find((c) => c.id === id) ?? null;
    setCampanha(campanhaAtual);
    setCotas(mapaCotas);
    return { campanha: campanhaAtual, cotas: mapaCotas };
  }

  function irParaPagamentoComCotas(
    campanhaAtual: Campanha,
    cotasReservadas: CotaResumo[],
    metodo: 'push' | 'replace' = 'push',
  ) {
    const numeros = cotasReservadas.map((cota) => cota.numero).sort((a, b) => a - b);
    const expira = cotasReservadas.find((cota) => cota.reservaExpiraEm)?.reservaExpiraEm;
    const parametros = new URLSearchParams({
      numeros: numeros.join(','),
      telefoneSuporte: campanhaAtual.telefoneSuporte,
      nomeCampanha: campanhaAtual.nome,
    });
    if (expira) parametros.set('expira', expira);
    router[metodo](`/campanhas/${id}/pagamento?${parametros.toString()}`);
  }

  // Ao acessar a campanha, se o comprador já tem uma reserva ativa (ainda
  // dentro do prazo de expiração) de um checkout que ele não finalizou, volta
  // direto para a tela de pagamento em vez de mostrar a seleção de novo.
  useEffect(() => {
    let cancelado = false;
    async function iniciar() {
      const resultado = await carregar();
      if (cancelado || !resultado) {
        setCarregandoDados(false);
        return;
      }
      // Vendas encerradas (todas as cotas já pagas, aguardando o sorteio):
      // não há mais nada para o comprador fazer aqui, então os detalhes da
      // campanha ficam bloqueados mesmo por acesso direto à URL.
      if (resultado.campanha?.status === 'LIBERADA_PARA_SORTEIO') {
        router.replace('/campanhas');
        return;
      }
      const reservasAtivas = resultado.cotas.filter((cota) => cota.minhaCota && cota.status === 'RESERVADA');
      if (resultado.campanha && reservasAtivas.length > 0) {
        irParaPagamentoComCotas(resultado.campanha, reservasAtivas, 'replace');
        return;
      }
      setCarregandoDados(false);
    }
    iniciar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao, id]);

  const minhasCotasReservadas = useMemo(
    () => cotas?.filter((cota) => cota.minhaCota && cota.status === 'RESERVADA').map((cota) => cota.numero) ?? [],
    [cotas],
  );

  const minhasCotasPagas = useMemo(
    () => cotas?.filter((cota) => cota.minhaCota && cota.status === 'PAGA').map((cota) => cota.numero) ?? [],
    [cotas],
  );

  function alternarSelecao(numero: number) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(numero)) {
        proximo.delete(numero);
        return proximo;
      }
      if (quantidadeMaximaPorCompra !== null && proximo.size >= quantidadeMaximaPorCompra) {
        setErro(`A compra máxima nesta campanha é de ${quantidadeMaximaPorCompra} cota(s).`);
        return proximo;
      }
      proximo.add(numero);
      return proximo;
    });
  }

  function escolherQuantidadeLote(quantidade: number) {
    const limite = quantidadeMaximaPorCompra ?? quantidade;
    setQuantidadeLote(Math.min(quantidade, limite));
    setLoteStaged(false);
  }

  function ajustarQuantidadeLote(delta: number) {
    setQuantidadeLote((atual) => {
      const limite = quantidadeMaximaPorCompra ?? Infinity;
      return Math.min(limite, Math.max(1, atual + delta));
    });
    setLoteStaged(false);
  }

  function sortearLote() {
    setErro(null);
    setLoteStaged(true);
  }

  // Ação única do botão "Confirmar cotas": só agora a reserva é de fato
  // salva no backend (e passa a aparecer no painel do administrador) — nem
  // tocar nos números (modo manual) nem sortear a quantidade (modo lote)
  // reserva nada por conta própria.
  async function confirmarCotas() {
    if (!sessao) return;
    const modoManual = formaVenda === 'ESCOLHA_NUMERO';

    if (modoManual && selecionados.size === 0) {
      setErro('Selecione pelo menos um número disponível.');
      return;
    }
    if (!modoManual && !loteStaged) {
      setErro('Toque em "Sortear cotas" antes de confirmar.');
      return;
    }

    setErro(null);
    setReservando(true);
    try {
      const escolha = modoManual
        ? { numeros: Array.from(selecionados) }
        : { quantidadeAleatoria: quantidadeLote };
      await campanhasApi.reservarLote(sessao.token, id, escolha);
      setSelecionados(new Set());
      setLoteStaged(false);
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar as cotas.');
    } finally {
      setReservando(false);
    }
  }

  async function cancelarReserva() {
    if (!sessao) return;
    if (!window.confirm('Tem certeza que deseja cancelar sua reserva? Os números voltam a ficar disponíveis.')) {
      return;
    }
    setErro(null);
    setCancelando(true);
    try {
      await campanhasApi.cancelarMinhaReserva(sessao.token, id);
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível cancelar a reserva.');
    } finally {
      setCancelando(false);
    }
  }

  function irParaPagamento() {
    if (!campanha || !cotas) return;
    const reservasAtivas = cotas.filter((cota) => cota.minhaCota && cota.status === 'RESERVADA');
    irParaPagamentoComCotas(campanha, reservasAtivas);
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
      <PageHeader eyebrow="Escolha sua cota" title={campanha?.nome ?? 'Campanha'} />

      {campanha && (
        <TicketCard tone="night">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Valor da cota</p>
          <p className="mt-1 font-display text-3xl text-white">{formatarMoeda(campanha.valorCota)}</p>
          <p className="mt-2 text-sm text-white/70">{campanha.quantidadeCotas} números disponíveis no total.</p>
        </TicketCard>
      )}

      {erro && <Alert tone="error">{erro}</Alert>}

      {minhasCotasPagas.length > 0 && (
        <TicketCard tone="night" className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            Você já tem {minhasCotasPagas.length} {minhasCotasPagas.length === 1 ? 'cota paga' : 'cotas pagas'}
          </p>
          <p className="font-mono text-xs text-white/70">
            Nº {minhasCotasPagas.slice().sort((a, b) => a - b).join(', ')}
          </p>
        </TicketCard>
      )}

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
            A reserva só é salva ao confirmar.
            {quantidadeMaximaPorCompra !== null && ` Máximo de ${quantidadeMaximaPorCompra} cota(s) por compra.`}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={confirmarCotas} loading={reservando} disabled={selecionados.size === 0} fullWidth>
              Confirmar cotas
            </Button>
            {minhasCotasReservadas.length > 0 && (
              <Button variant="danger" onClick={cancelarReserva} loading={cancelando} fullWidth>
                Cancelar reserva
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Escolha a quantidade do lote</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LOTES_PRESET.map((quantidade) => {
              const excedeLimite = quantidadeMaximaPorCompra !== null && quantidade > quantidadeMaximaPorCompra;
              return (
                <button
                  key={quantidade}
                  type="button"
                  disabled={excedeLimite}
                  onClick={() => escolherQuantidadeLote(quantidade)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    excedeLimite
                      ? 'cursor-not-allowed border-line bg-mist text-muted'
                      : quantidadeLote === quantidade
                        ? 'border-accent-ink bg-accent text-ink'
                        : 'border-line bg-white text-night hover:border-accent-ink'
                  }`}
                >
                  {quantidade}
                </button>
              );
            })}
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
              disabled={quantidadeMaximaPorCompra !== null && quantidadeLote >= quantidadeMaximaPorCompra}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg font-semibold text-night hover:border-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Aumentar 1 cota"
            >
              +
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Escolhemos {quantidadeLote} número{quantidadeLote === 1 ? '' : 's'} aleatório{quantidadeLote === 1 ? '' : 's'} entre os disponíveis.
            A reserva só é salva ao confirmar.
            {quantidadeMaximaPorCompra !== null && ` Máximo de ${quantidadeMaximaPorCompra} cota(s) por compra.`}
          </p>

          {!loteStaged ? (
            <Button onClick={sortearLote} fullWidth>
              {`Sortear ${quantidadeLote} cota${quantidadeLote === 1 ? '' : 's'}`}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs font-medium text-accent-ink">
                {quantidadeLote} cota{quantidadeLote === 1 ? '' : 's'} pronta{quantidadeLote === 1 ? '' : 's'} para
                confirmar.
              </p>
              <Button onClick={confirmarCotas} loading={reservando} fullWidth>
                Confirmar cotas
              </Button>
            </div>
          )}

          {minhasCotasReservadas.length > 0 && (
            <Button variant="danger" onClick={cancelarReserva} loading={cancelando} fullWidth>
              Cancelar reserva
            </Button>
          )}
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../../components/ui/PageHeader';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { Badge } from '../../../../../../components/ui/Badge';
import { Spinner } from '../../../../../../components/ui/Spinner';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { IconArrowLeft, IconWhatsapp, IconGift } from '../../../../../../components/ui/icons';
import {
  campanhasApi,
  gruposApi,
  premiosApi,
  type Campanha,
  type DetalheGrupo,
  type Premio,
  type StatusCota,
} from '../../../../../../lib/api';
import { formatarTelefone } from '../../../../../../lib/format';
import { useSessaoAdministrador } from '../../../../../../lib/auth';

// ---------- Dados de reservas: protótipo local até existir endpoint admin ----------
// A tela usa dados reais de campanha, grupo e prêmio (já servidos pela API).
// O mapa de cotas e o histórico de reservas ainda não têm endpoint no backend
// (falta expor comprador por cota para o administrador), então são simulados
// aqui com o mesmo formato que a API deve retornar no futuro.

interface CotaAdmin {
  numero: number;
  status: StatusCota;
  compradorId: string | null;
  compradorNome: string | null;
  compradorTelefone: string | null;
}

const COMPRADORES_MOCK = [
  { id: 'mock-1', nome: 'Marcos Andrade', telefone: '11987654321' },
  { id: 'mock-2', nome: 'Juliana Prado', telefone: '21998765432' },
  { id: 'mock-3', nome: 'Carlos Eduardo Reis', telefone: '31991234567' },
  { id: 'mock-4', nome: 'Fernanda Lima', telefone: '41999887766' },
  { id: 'mock-5', nome: 'Rafael Souza', telefone: '51988776655' },
  { id: 'mock-6', nome: 'Patrícia Nunes', telefone: '61997665544' },
];

function gerarCotasMock(totalCotas: number): CotaAdmin[] {
  return Array.from({ length: totalCotas }, (_, indice) => {
    const numero = indice + 1;
    // hash simples e determinístico só para distribuir status de forma estável
    const posicao = (numero * 2654435761) % 100;

    let status: StatusCota = 'DISPONIVEL';
    let comprador: (typeof COMPRADORES_MOCK)[number] | null = null;

    if (posicao < 22) {
      status = 'PAGA';
      comprador = COMPRADORES_MOCK[numero % COMPRADORES_MOCK.length];
    } else if (posicao < 38) {
      status = 'RESERVADA';
      comprador = COMPRADORES_MOCK[numero % COMPRADORES_MOCK.length];
    }

    return {
      numero,
      status,
      compradorId: comprador?.id ?? null,
      compradorNome: comprador?.nome ?? null,
      compradorTelefone: comprador?.telefone ?? null,
    };
  });
}

function linkWhatsapp(telefone: string): string {
  return `https://wa.me/55${telefone.replace(/\D/g, '')}`;
}

export default function SorteioCampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [grupo, setGrupo] = useState<DetalheGrupo | null>(null);
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [cotas, setCotas] = useState<CotaAdmin[] | null>(null);

  useEffect(() => {
    if (!sessao) return;
    (async () => {
      const [campanhaData, premiosData] = await Promise.all([
        campanhasApi.buscar(sessao.token, id),
        premiosApi.listar(sessao.token),
      ]);
      setCampanha(campanhaData);
      setPremios(premiosData);
      if (campanhaData.grupoId) {
        setGrupo(await gruposApi.buscar(sessao.token, campanhaData.grupoId));
      }
    })();
  }, [sessao, id]);

  useEffect(() => {
    if (campanha && cotas === null) {
      setCotas(gerarCotasMock(campanha.quantidadeCotas));
    }
  }, [campanha, cotas]);

  const premiosDaCampanha = useMemo(
    () => premios?.filter((premio) => campanha?.premioIds.includes(premio.id)) ?? [],
    [premios, campanha],
  );
  const premioPrincipal = premiosDaCampanha[0] ?? null;

  const reservasPorComprador = useMemo(() => {
    if (!cotas) return [];
    const mapa = new Map<string, { compradorId: string; nome: string; telefone: string; numeros: number[] }>();
    for (const cota of cotas) {
      if (cota.status !== 'RESERVADA' || !cota.compradorId || !cota.compradorNome || !cota.compradorTelefone) {
        continue;
      }
      const existente = mapa.get(cota.compradorId);
      if (existente) {
        existente.numeros.push(cota.numero);
      } else {
        mapa.set(cota.compradorId, {
          compradorId: cota.compradorId,
          nome: cota.compradorNome,
          telefone: cota.compradorTelefone,
          numeros: [cota.numero],
        });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cotas]);

  function confirmarPagamento(compradorId: string) {
    setCotas(
      (atual) =>
        atual?.map((cota) =>
          cota.compradorId === compradorId && cota.status === 'RESERVADA' ? { ...cota, status: 'PAGA' } : cota,
        ) ?? null,
    );
  }

  function liberarCotasReservadas(compradorId: string) {
    setCotas(
      (atual) =>
        atual?.map((cota) =>
          cota.compradorId === compradorId && cota.status === 'RESERVADA'
            ? { numero: cota.numero, status: 'DISPONIVEL', compradorId: null, compradorNome: null, compradorTelefone: null }
            : cota,
        ) ?? null,
    );
  }

  if (!campanha || !cotas) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  const totalCotas = campanha.quantidadeCotas;
  const totalPagas = cotas.filter((cota) => cota.status === 'PAGA').length;
  const totalReservadas = cotas.filter((cota) => cota.status === 'RESERVADA').length;
  const pctPagas = totalCotas ? (totalPagas / totalCotas) * 100 : 0;
  const pctReservadas = totalCotas ? (totalReservadas / totalCotas) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push(`/admin/campanhas/${id}`)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" /> Voltar para a campanha
      </button>

      <PageHeader eyebrow="Sorteio" title={campanha.nome} />

      {/* Seção 1 — informações do sorteio */}
      <Card className="flex flex-col gap-4 sm:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-mist sm:h-32 sm:w-32">
          {premioPrincipal?.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- fotos de prêmio vêm de qualquer host externo
            <img src={premioPrincipal.fotoUrl} alt={premioPrincipal.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <IconGift className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {premioPrincipal ? premioPrincipal.nome : 'Prêmio'}
          </p>
          <p className="text-sm text-night">{premioPrincipal?.descricao ?? campanha.descricao}</p>
          {premiosDaCampanha.length > 1 && (
            <p className="text-xs text-muted">
              + {premiosDaCampanha.length - 1} prêmio{premiosDaCampanha.length - 1 > 1 ? 's' : ''} adicional
              {premiosDaCampanha.length - 1 > 1 ? 'is' : ''}
            </p>
          )}
          <div className="mt-1">
            {grupo ? (
              <Badge tone="accent">{grupo.nome}</Badge>
            ) : (
              <Badge tone="neutral">Sem grupo vinculado</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Seção 2 — progresso de cotas vendidas */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-night">Cotas vendidas</p>
          <p className="font-mono text-sm text-muted">
            {totalPagas} de {totalCotas} pagas
            {totalReservadas > 0 && ` · ${totalReservadas} aguardando confirmação`}
          </p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-mist">
          <div className="h-full bg-accent" style={{ width: `${pctPagas}%` }} />
          <div className="h-full bg-amber-400" style={{ width: `${pctReservadas}%` }} />
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <LegendaItem cor="bg-accent" label="Pagas" />
          <LegendaItem cor="bg-amber-400" label="Reservadas" />
          <LegendaItem cor="bg-mist border border-line" label="Disponíveis" />
        </div>
      </Card>

      {/* Seção 3 — histórico de cotas reservadas */}
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Cotas reservadas aguardando confirmação</p>

        {reservasPorComprador.length === 0 ? (
          <EmptyState
            title="Nenhuma cota reservada"
            description="Assim que compradores reservarem cotas, elas aparecem aqui para você confirmar o pagamento ou liberar."
          />
        ) : (
          <>
            {/* Mobile: lista de cards — uma tabela larga não cabe na tela e escondia os botões de ação */}
            <div className="flex flex-col gap-3 sm:hidden">
              {reservasPorComprador.map((reserva) => (
                <div key={reserva.compradorId} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                  <div>
                    <p className="font-medium text-night">{reserva.nome}</p>
                    <p className="font-mono text-xs text-muted">{formatarTelefone(reserva.telefone)}</p>
                  </div>
                  <NumerosReservados numeros={reserva.numeros} />
                  <AcoesReserva
                    reserva={reserva}
                    onConfirmar={confirmarPagamento}
                    onLiberar={liberarCotasReservadas}
                    fullWidth
                  />
                </div>
              ))}
            </div>

            {/* Telas maiores: tabela */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4 font-mono font-medium">Comprador</th>
                    <th className="py-2 pr-4 font-mono font-medium">Telefone</th>
                    <th className="py-2 pr-4 font-mono font-medium">Cotas reservadas</th>
                    <th className="py-2 pr-4 font-mono font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasPorComprador.map((reserva) => (
                    <tr key={reserva.compradorId} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4 font-medium text-night">{reserva.nome}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted">{formatarTelefone(reserva.telefone)}</td>
                      <td className="py-3 pr-4">
                        <NumerosReservados numeros={reserva.numeros} />
                      </td>
                      <td className="py-3 pr-4">
                        <AcoesReserva reserva={reserva} onConfirmar={confirmarPagamento} onLiberar={liberarCotasReservadas} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Mapa de cotas */}
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Mapa de cotas</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <LegendaItem cor="bg-white border border-line" label="Disponível" />
          <LegendaItem cor="bg-amber-400" label="Reservada — aguardando confirmação" />
          <LegendaItem cor="bg-accent" label="Paga" />
        </div>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12">
          {cotas.map((cota) => (
            <CelulaCota key={cota.numero} cota={cota} />
          ))}
        </div>
      </Card>
    </div>
  );
}

interface ReservaComprador {
  compradorId: string;
  nome: string;
  telefone: string;
  numeros: number[];
}

function NumerosReservados({ numeros }: { numeros: number[] }) {
  const numerosOrdenados = numeros.slice().sort((a, b) => a - b);
  const numerosExibidos = numerosOrdenados.slice(0, 6);
  const restante = numerosOrdenados.length - numerosExibidos.length;

  return (
    <div>
      <p className="text-xs text-muted">
        {numerosOrdenados.length} cota{numerosOrdenados.length > 1 ? 's' : ''}
      </p>
      <p className="font-mono text-xs text-night">
        Nº {numerosExibidos.join(', ')}
        {restante > 0 && ` +${restante}`}
      </p>
    </div>
  );
}

function AcoesReserva({
  reserva,
  onConfirmar,
  onLiberar,
  fullWidth = false,
}: {
  reserva: ReservaComprador;
  onConfirmar: (compradorId: string) => void;
  onLiberar: (compradorId: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${fullWidth ? 'flex-col items-stretch' : ''}`}>
      <Button className="px-3 py-2 text-xs" onClick={() => onConfirmar(reserva.compradorId)}>
        Confirmar pagamento
      </Button>
      <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onLiberar(reserva.compradorId)}>
        Liberar cotas reservadas
      </Button>
      <a
        href={linkWhatsapp(reserva.telefone)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-night transition hover:border-night/30"
      >
        <IconWhatsapp className="h-4 w-4" />
        WhatsApp
      </a>
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

function CelulaCota({ cota }: { cota: CotaAdmin }) {
  const CLASSES: Record<StatusCota, string> = {
    DISPONIVEL: 'bg-white text-night border border-line',
    RESERVADA: 'bg-amber-400 text-amber-950 border border-amber-500',
    PAGA: 'bg-accent text-ink border border-accent-ink/30',
    CANCELADA_REEMBOLSADA: 'bg-mist text-muted border border-line line-through',
  };

  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-lg font-mono text-xs font-medium ${CLASSES[cota.status]}`}
      title={cota.compradorNome ?? undefined}
    >
      {cota.numero}
    </div>
  );
}

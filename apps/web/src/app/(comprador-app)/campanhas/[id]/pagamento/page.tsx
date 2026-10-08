'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Spinner } from '../../../../../components/ui/Spinner';
import { IconCheck, IconCopy, IconGift, IconWhatsapp } from '../../../../../components/ui/icons';
import { campanhasApi, pagamentosApi, urlArquivoApi, ApiError, type CampanhaPublica, type CotaResumoPublico } from '../../../../../lib/api';
import { formatarMoeda } from '../../../../../lib/format';
import { useSessaoCompradorOpcional } from '../../../../../lib/auth';

const TIPOS_IMAGEM_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];
const TAMANHO_MAXIMO_IMAGEM_BYTES = 3 * 1024 * 1024;

/** Alguns navegadores (principalmente com fotos HEIC do iPhone) deixam `File.type` vazio — cai para a extensão. */
function obterTipoArquivo(arquivo: File): string {
  if (arquivo.type) return arquivo.type;
  const extensao = arquivo.name.split('.').pop()?.toLowerCase();
  if (extensao === 'heic') return 'image/heic';
  if (extensao === 'heif') return 'image/heif';
  return '';
}

function useContagemRegressiva(expiraIso: string | null) {
  const [restanteMs, setRestanteMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiraIso) return;
    const alvo = new Date(expiraIso).getTime();

    const atualizar = () => setRestanteMs(Math.max(0, alvo - Date.now()));
    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
  }, [expiraIso]);

  if (restanteMs === null) return null;
  const minutos = Math.floor(restanteMs / 60000);
  const segundos = Math.floor((restanteMs % 60000) / 1000);
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

export default function PagamentoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const numeros = useMemo(
    () =>
      (searchParams.get('numeros') ?? '')
        .split(',')
        .map(Number)
        .filter((n) => !Number.isNaN(n) && n > 0),
    [searchParams],
  );
  const expira = searchParams.get('expira');
  const telefoneSuporte = searchParams.get('telefoneSuporte') ?? '';
  const nomeCampanha = searchParams.get('nomeCampanha') ?? '';
  // Presente só na reserva feita sem login (ver reservarComoConvidado) — troca
  // a cobrança autenticada pela cobrança de convidado, sem exigir sessão.
  const tokenConvidado = searchParams.get('tokenConvidado');
  // O layout já garante login OU tokenConvidado válido nesta rota — aqui só
  // decide qual das duas cobranças chamar, sem redirecionar de novo.
  const { sessao } = useSessaoCompradorOpcional();

  const contagem = useContagemRegressiva(expira);
  const { campanha, cotas } = useAndamentoCampanha(id);
  // Comprador sem conta não tem pra onde voltar depois (a lista de campanhas
  // exige login) — em vez de mandar pra algum lugar, o pagamento encerra
  // aqui mesmo com uma mensagem de conclusão.
  const [compraFinalizada, setCompraFinalizada] = useState(false);

  if (numeros.length === 0) {
    return <Alert tone="error">Nenhuma cota informada para pagamento.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={
          compraFinalizada
            ? undefined
            : numeros.length === 1
              ? `Cota nº ${numeros[0]}`
              : `${numeros.length} cotas selecionadas`
        }
        title={compraFinalizada ? 'Tudo certo!' : 'Pagamento'}
        description={
          !compraFinalizada && numeros.length > 1
            ? `Nº ${numeros.slice().sort((a, b) => a - b).join(', ')}`
            : undefined
        }
        action={
          !compraFinalizada &&
          contagem && <Badge tone={contagem === '0:00' ? 'danger' : 'warning'}>Expira em {contagem}</Badge>
        }
      />

      <PagamentoPix
        campanhaId={id}
        numeros={numeros}
        token={sessao?.token}
        tokenConvidado={tokenConvidado}
        telefoneSuporte={telefoneSuporte}
        nomeCampanha={nomeCampanha}
        compraFinalizada={compraFinalizada}
        fotoCampanhaUrl={campanha?.fotoUrl ?? null}
        nomeCampanhaPublico={campanha?.nome ?? nomeCampanha}
        onFinalizarSemConta={() => setCompraFinalizada(true)}
      />

      <PainelAndamento campanha={campanha} cotas={cotas} />
    </div>
  );
}

function PagamentoPix({
  campanhaId,
  numeros,
  token,
  tokenConvidado,
  telefoneSuporte,
  nomeCampanha,
  compraFinalizada,
  fotoCampanhaUrl,
  nomeCampanhaPublico,
  onFinalizarSemConta,
}: {
  campanhaId: string;
  numeros: number[];
  token?: string;
  tokenConvidado: string | null;
  telefoneSuporte: string;
  nomeCampanha: string;
  compraFinalizada: boolean;
  fotoCampanhaUrl: string | null;
  nomeCampanhaPublico: string;
  onFinalizarSemConta: () => void;
}) {
  const router = useRouter();
  const inputComprovanteRef = useRef<HTMLInputElement>(null);
  const [resultado, setResultado] = useState<{ qrCode: string; codigoCopiaCola: string; valorTotal: number } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [previewComprovante, setPreviewComprovante] = useState<string | null>(null);

  // O Pix é gerado assim que a página abre (a reserva já foi confirmada na
  // tela anterior); o ref evita gerar duas vezes no double-render do modo dev.
  const geracaoIniciada = useRef(false);
  useEffect(() => {
    if (geracaoIniciada.current || (!token && !tokenConvidado)) return;
    geracaoIniciada.current = true;
    gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tokenConvidado]);

  async function gerar() {
    if (!token && !tokenConvidado) return;
    setErro(null);
    setCarregando(true);
    try {
      const cobranca = tokenConvidado
        ? await pagamentosApi.gerarCobrancaPixConvidado(campanhaId, numeros, tokenConvidado)
        : await pagamentosApi.gerarCobrancaPix(token!, campanhaId, numeros);
      setResultado({
        qrCode: cobranca.qrCode,
        codigoCopiaCola: cobranca.codigoCopiaCola,
        valorTotal: cobranca.valor,
      });
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível gerar a cobrança Pix.');
    } finally {
      setCarregando(false);
    }
  }

  // Puramente informativo pro administrador (coluna "Pagamento" em "Cotas
  // compradas") — a compra em si já foi concluída ao gerar o Pix, então uma
  // falha aqui não deve travar o fluxo do comprador.
  async function finalizarCompra() {
    try {
      if (tokenConvidado) {
        await pagamentosApi.finalizarCompraConvidado(campanhaId, numeros, tokenConvidado);
      } else if (token) {
        await pagamentosApi.finalizarCompra(token, campanhaId, numeros);
      }
    } catch {
      // melhor esforço: segue o fluxo normalmente mesmo se isso falhar.
    }
    if (token) {
      router.push('/campanhas');
    } else {
      onFinalizarSemConta();
    }
  }

  function aoSelecionarComprovante(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0] ?? null;
    evento.target.value = '';
    if (!arquivo) return;

    setErro(null);

    const tipo = obterTipoArquivo(arquivo);
    if (!TIPOS_IMAGEM_PERMITIDOS.includes(tipo)) {
      setErro('O comprovante deve ser uma imagem em um dos formatos: JPEG, PNG, SVG, WEBP, GIF ou HEIC.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM_BYTES) {
      setErro('A imagem deve ter no máximo 3MB.');
      return;
    }

    const arquivoCorrigido = tipo !== arquivo.type ? new File([arquivo], arquivo.name, { type: tipo }) : arquivo;
    setPreviewComprovante(URL.createObjectURL(arquivoCorrigido));
  }

  const numerosOrdenados = numeros.slice().sort((a, b) => a - b);
  const mensagemWhatsapp =
    `Olá! Segue o comprovante de pagamento da(s) cota(s) nº ${numerosOrdenados.join(', ')}` +
    (nomeCampanha ? ` da campanha "${nomeCampanha}".` : '.');
  const linkWhatsapp = telefoneSuporte
    ? `https://wa.me/55${telefoneSuporte.replace(/\D/g, '')}?text=${encodeURIComponent(mensagemWhatsapp)}`
    : null;

  if (compraFinalizada) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        {fotoCampanhaUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem da campanha, vem da API
          <img
            src={urlArquivoApi(fotoCampanhaUrl)}
            alt={nomeCampanhaPublico}
            className="mb-2 aspect-[3/4] w-full max-w-[280px] rounded-2xl object-cover"
          />
        )}
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent-ink">
          <IconCheck className="h-7 w-7" />
        </span>
        <p className="font-display text-2xl text-night">Compra realizada com sucesso!</p>
        <p className="text-sm text-muted">Agora é só aguardar o sorteio e BOA SORTE!</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      {erro && <Alert tone="error">{erro}</Alert>}

      {!resultado ? (
        carregando || !erro ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted">
            <Spinner size={18} /> Gerando seu Pix...
          </div>
        ) : (
          <Button onClick={gerar} loading={carregando}>
            Tentar novamente
          </Button>
        )
      ) : (
        <>
          <p className="font-display text-3xl text-night">{formatarMoeda(resultado.valorTotal)}</p>
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-line bg-white p-4">
            <QRCodeSVG value={resultado.qrCode} size={176} />
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(resultado.codigoCopiaCola);
              setCopiado(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-night hover:border-night/30"
          >
            <IconCopy className="h-4 w-4" /> {copiado ? 'Copiado!' : 'Copiar código copia e cola'}
          </button>
          <p className="text-xs text-muted">
            O Pix vai direto para a chave cadastrada pelo administrador da campanha. Depois de pagar, envie o
            comprovante pelo WhatsApp abaixo — {numeros.length > 1 ? 'suas cotas mudam' : 'sua cota muda'} para paga
            assim que o administrador confirmar o recebimento.
          </p>

          <div className="mt-2 flex w-full flex-col items-stretch gap-4 border-t border-line pt-4 text-left">
            <div>
              <p className="text-sm font-medium text-night">Comprovante de pagamento</p>
              <p className="mb-2 text-xs text-muted">
                Duas opções independentes e opcionais: anexe o comprovante e/ou envie pelo WhatsApp.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist">
                  {previewComprovante ? (
                    // eslint-disable-next-line @next/next/no-img-element -- prévia local do arquivo selecionado
                    <img src={previewComprovante} alt="Comprovante de pagamento" className="h-full w-full object-cover" />
                  ) : (
                    <IconGift className="h-6 w-6 text-muted" />
                  )}
                </div>
                <div>
                  <input
                    ref={inputComprovanteRef}
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/heic,image/heif"
                    className="hidden"
                    onChange={aoSelecionarComprovante}
                  />
                  <Button type="button" variant="secondary" onClick={() => inputComprovanteRef.current?.click()}>
                    {previewComprovante ? 'Trocar comprovante' : 'Anexar comprovante'}
                  </Button>
                </div>
              </div>
            </div>

            <a
              href={linkWhatsapp ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(evento) => {
                if (!linkWhatsapp) {
                  evento.preventDefault();
                  setErro('Número de suporte não disponível para envio pelo WhatsApp.');
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                linkWhatsapp
                  ? 'border-line bg-white text-night hover:border-night/30'
                  : 'cursor-not-allowed border-line bg-mist text-muted'
              }`}
            >
              <IconWhatsapp className="h-4 w-4" /> Enviar comprovante pelo WhatsApp
            </a>
          </div>

          <Button type="button" onClick={finalizarCompra} fullWidth>
            Finalizar compra
          </Button>
        </>
      )}
    </Card>
  );
}

const MARCOS_ANDAMENTO = [25, 50, 75];
const INTERVALO_ATUALIZACAO_MS = 20_000;

function mensagemAndamento(percentual: number, faltam: number): string {
  if (faltam === 0) return 'Todas as cotas foram pagas — o sorteio já pode acontecer!';
  if (percentual < 25) return 'A campanha está começando — cada cota paga aproxima o sorteio.';
  if (percentual < 50) return 'Já passamos de um quarto das cotas!';
  if (percentual < 80) return 'Passamos da metade — o sorteio está cada vez mais perto.';
  return 'Falta pouco para o sorteio!';
}

/** Dados públicos da campanha + mapa de cotas, atualizados periodicamente (compartilhados pelo painel e pela tela de conclusão). */
function useAndamentoCampanha(campanhaId: string) {
  const [campanha, setCampanha] = useState<CampanhaPublica | null>(null);
  const [cotas, setCotas] = useState<CotaResumoPublico[] | null>(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const [dadosCampanha, dadosCotas] = await Promise.all([
          campanhasApi.buscarPublica(campanhaId),
          campanhasApi.listarCotasPublicas(campanhaId),
        ]);
        if (!ativo) return;
        setCampanha(dadosCampanha);
        setCotas(dadosCotas);
      } catch {
        // Informativo: se falhar, painel e foto simplesmente não aparecem.
      }
    }
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [campanhaId]);

  return { campanha, cotas };
}

/** Mostra o quanto da campanha já foi vendido e o quanto falta pro sorteio, com atalho pro grupo de WhatsApp. */
function PainelAndamento({ campanha, cotas }: { campanha: CampanhaPublica | null; cotas: CotaResumoPublico[] | null }) {
  if (!campanha || !cotas) return null;

  const total = cotas.length;
  const pagas = cotas.filter((cota) => cota.status === 'PAGA').length;
  const reservadas = cotas.filter((cota) => cota.status === 'RESERVADA').length;
  const faltam = total - pagas;
  const exato = total > 0 ? (pagas / total) * 100 : 0;
  // Nunca mostra 100% enquanto ainda falta alguma cota ser paga.
  const percentual = faltam > 0 ? Math.min(99, Math.round(exato)) : 100;
  const percentualReservado = total > 0 ? (reservadas / total) * 100 : 0;

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Andamento da campanha</p>
          <p className="mt-1 font-display text-4xl leading-none text-night">{percentual}%</p>
          <p className="mt-1 text-xs text-muted">das cotas já foram pagas</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl leading-none text-night">{faltam}</p>
          <p className="mt-1 text-xs text-muted">
            {faltam === 1 ? 'cota falta' : 'cotas faltam'} para o sorteio
          </p>
        </div>
      </div>

      <div>
        <div
          role="progressbar"
          aria-valuenow={percentual}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de cotas pagas"
          className="relative flex h-4 w-full overflow-hidden rounded-full bg-mist"
        >
          <div className="h-full bg-accent transition-all duration-700" style={{ width: `${exato}%` }} />
          <div className="h-full bg-amber-300 transition-all duration-700" style={{ width: `${percentualReservado}%` }} />
          {MARCOS_ANDAMENTO.map((marco) => (
            <span key={marco} aria-hidden className="absolute top-0 h-full w-px bg-white/80" style={{ left: `${marco}%` }} />
          ))}
        </div>
        <div className="relative mt-1.5 h-4 font-mono text-[10px] text-muted" aria-hidden>
          {MARCOS_ANDAMENTO.map((marco) => (
            <span key={marco} className="absolute -translate-x-1/2" style={{ left: `${marco}%` }}>
              {marco}%
            </span>
          ))}
          <span className="absolute right-0">Sorteio</span>
        </div>
      </div>

      <p className="text-sm font-medium text-night">{mensagemAndamento(percentual, faltam)}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-accent" /> {pagas} de {total} pagas
        </span>
        {reservadas > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-amber-300" /> {reservadas} reservada{reservadas > 1 ? 's' : ''}{' '}
            aguardando pagamento
          </span>
        )}
      </div>

      {campanha.linkGrupoWhatsapp && (
        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-strong">Acompanhe todos os detalhes da campanha direto no grupo</p>
          <a
            href={campanha.linkGrupoWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            <IconWhatsapp className="h-4 w-4" /> Grupo de WhatsApp
          </a>
        </div>
      )}
    </Card>
  );
}

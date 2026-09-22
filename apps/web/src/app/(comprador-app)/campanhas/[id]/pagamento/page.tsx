'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { IconCopy, IconGift, IconWhatsapp } from '../../../../../components/ui/icons';
import { pagamentosApi, ApiError } from '../../../../../lib/api';
import { formatarMoeda } from '../../../../../lib/format';
import { useSessaoComprador } from '../../../../../lib/auth';

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
  const { sessao } = useSessaoComprador();

  const contagem = useContagemRegressiva(expira);

  if (numeros.length === 0) {
    return <Alert tone="error">Nenhuma cota informada para pagamento.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={numeros.length === 1 ? `Cota nº ${numeros[0]}` : `${numeros.length} cotas selecionadas`}
        title="Pagamento"
        description={numeros.length > 1 ? `Nº ${numeros.slice().sort((a, b) => a - b).join(', ')}` : undefined}
        action={contagem && <Badge tone={contagem === '0:00' ? 'danger' : 'warning'}>Expira em {contagem}</Badge>}
      />

      <PagamentoPix
        campanhaId={id}
        numeros={numeros}
        token={sessao?.token}
        telefoneSuporte={telefoneSuporte}
        nomeCampanha={nomeCampanha}
      />
    </div>
  );
}

function PagamentoPix({
  campanhaId,
  numeros,
  token,
  telefoneSuporte,
  nomeCampanha,
}: {
  campanhaId: string;
  numeros: number[];
  token?: string;
  telefoneSuporte: string;
  nomeCampanha: string;
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

  async function gerar() {
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      const cobranca = await pagamentosApi.gerarCobrancaPix(token, campanhaId, numeros);
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

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      {erro && <Alert tone="error">{erro}</Alert>}

      {!resultado ? (
        <>
          <p className="text-sm text-muted">
            Gere um QR Code Pix único, cobrindo {numeros.length > 1 ? `as ${numeros.length} cotas` : 'a cota'}{' '}
            selecionada{numeros.length > 1 ? 's' : ''}, válido pelo tempo restante da reserva.
          </p>
          <Button onClick={gerar} loading={carregando}>
            Gerar cobrança Pix
          </Button>
        </>
      ) : (
        <>
          <p className="font-display text-3xl text-night">{formatarMoeda(resultado.valorTotal)}</p>
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-line bg-mist p-4 font-mono text-[10px] leading-tight text-muted break-all">
            {resultado.qrCode}
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
            Assim que o pagamento for confirmado pelo gateway, {numeros.length > 1 ? 'suas cotas mudam' : 'sua cota muda'} automaticamente para paga.
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

          <Button type="button" onClick={() => router.push('/campanhas')} fullWidth>
            Finalizar compra
          </Button>
        </>
      )}
    </Card>
  );
}

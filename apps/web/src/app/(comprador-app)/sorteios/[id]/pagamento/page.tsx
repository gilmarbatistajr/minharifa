'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { TextField } from '../../../../../components/ui/Field';
import { IconCard, IconCopy, IconPix, IconWallet } from '../../../../../components/ui/icons';
import { pagamentosApi, ApiError } from '../../../../../lib/api';
import { formatarMoeda } from '../../../../../lib/format';
import { useSessaoComprador } from '../../../../../lib/auth';

type Aba = 'pix' | 'cartao' | 'cashback';

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
  const numero = Number(searchParams.get('numero'));
  const expira = searchParams.get('expira');
  const { sessao } = useSessaoComprador();

  const [aba, setAba] = useState<Aba>('pix');
  const contagem = useContagemRegressiva(expira);

  const abas = useMemo(
    () => [
      { id: 'pix' as const, label: 'Pix', icon: IconPix },
      { id: 'cartao' as const, label: 'Cartão', icon: IconCard },
      { id: 'cashback' as const, label: 'Cashback', icon: IconWallet },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Cota nº ${numero}`}
        title="Pagamento"
        action={contagem && <Badge tone={contagem === '0:00' ? 'danger' : 'warning'}>Expira em {contagem}</Badge>}
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {abas.map((item) => (
          <button
            key={item.id}
            onClick={() => setAba(item.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              aba === item.id
                ? 'border-accent-ink bg-accent text-ink'
                : 'border-line bg-white text-night hover:border-night/30'
            }`}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
      </div>

      {aba === 'pix' && <PagamentoPix sorteioId={id} numero={numero} token={sessao?.token} />}
      {aba === 'cartao' && <PagamentoCartao sorteioId={id} numero={numero} token={sessao?.token} />}
      {aba === 'cashback' && <PagamentoCashback sorteioId={id} numero={numero} token={sessao?.token} />}
    </div>
  );
}

function PagamentoPix({ sorteioId, numero, token }: { sorteioId: string; numero: number; token?: string }) {
  const [resultado, setResultado] = useState<{ qrCode: string; codigoCopiaCola: string; valor: number } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function gerar() {
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      setResultado(await pagamentosApi.gerarCobrancaPix(token, sorteioId, numero));
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível gerar a cobrança Pix.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      {erro && <Alert tone="error">{erro}</Alert>}

      {!resultado ? (
        <>
          <p className="text-sm text-muted">Gere um QR Code Pix válido pelo tempo restante da reserva.</p>
          <Button onClick={gerar} loading={carregando}>
            Gerar cobrança Pix
          </Button>
        </>
      ) : (
        <>
          <p className="font-display text-3xl text-night">{formatarMoeda(resultado.valor)}</p>
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
            Assim que o pagamento for confirmado pelo gateway, sua cota muda automaticamente para paga.
          </p>
        </>
      )}
    </Card>
  );
}

function PagamentoCartao({ sorteioId, numero, token }: { sorteioId: string; numero: number; token?: string }) {
  const [numeroCartao, setNumeroCartao] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<'APROVADO' | 'RECUSADO' | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await pagamentosApi.pagarComCartao(token, sorteioId, numero, {
        numero: numeroCartao,
        validade,
        cvv,
        nomeTitular,
      });
      setResultado(resposta.status);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível processar o pagamento.');
    } finally {
      setCarregando(false);
    }
  }

  if (resultado === 'APROVADO') {
    return <Alert tone="success">Pagamento aprovado! Sua cota já está confirmada como paga.</Alert>;
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}
        {resultado === 'RECUSADO' && (
          <Alert tone="error">
            Pagamento não aprovado pelo cartão. Sua reserva continua ativa — tente novamente com
            outro método antes de expirar.
          </Alert>
        )}

        <TextField
          label="Número do cartão"
          inputMode="numeric"
          required
          value={numeroCartao}
          onChange={(e) => setNumeroCartao(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Validade" placeholder="MM/AA" required value={validade} onChange={(e) => setValidade(e.target.value)} />
          <TextField label="CVV" inputMode="numeric" required value={cvv} onChange={(e) => setCvv(e.target.value)} />
        </div>
        <TextField label="Nome do titular" required value={nomeTitular} onChange={(e) => setNomeTitular(e.target.value)} />

        <Button type="submit" fullWidth loading={carregando}>
          Pagar com cartão
        </Button>
      </form>
    </Card>
  );
}

function PagamentoCashback({ sorteioId, numero, token }: { sorteioId: string; numero: number; token?: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ pagoIntegralmente: boolean; valorAbatido: number; valorRestante: number } | null>(
    null,
  );
  const [carregando, setCarregando] = useState(false);

  async function pagar() {
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      setResultado(await pagamentosApi.pagarComCashback(token, sorteioId, numero));
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível usar o cashback.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 text-center">
      {erro && <Alert tone="error">{erro}</Alert>}

      {!resultado ? (
        <>
          <p className="text-sm text-muted">
            Use o saldo de cashback disponível na sua conta para pagar esta cota, total ou
            parcialmente.
          </p>
          <Button onClick={pagar} loading={carregando}>
            Pagar com cashback
          </Button>
        </>
      ) : resultado.pagoIntegralmente ? (
        <Alert tone="success">
          Cashback de {formatarMoeda(resultado.valorAbatido)} cobriu o valor total. Cota confirmada
          como paga!
        </Alert>
      ) : (
        <Alert tone="info">
          Abatemos {formatarMoeda(resultado.valorAbatido)} de cashback. Restam{' '}
          {formatarMoeda(resultado.valorRestante)} — finalize pelo Pix ou cartão.
        </Alert>
      )}
    </Card>
  );
}

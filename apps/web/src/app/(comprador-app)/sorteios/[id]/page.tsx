'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card, TicketCard } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { TextField } from '../../../../components/ui/Field';
import { sorteiosApi, ApiError } from '../../../../lib/api';
import { useSessaoComprador } from '../../../../lib/auth';

export default function DetalheSorteioPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoComprador();
  const router = useRouter();

  const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(null);
  const [numeroDigitado, setNumeroDigitado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);

  async function reservar(numero: number) {
    if (!sessao) return;
    setErro(null);
    setReservando(true);
    try {
      const resultado = await sorteiosApi.reservarCota(sessao.token, id, numero);
      const parametros = new URLSearchParams({
        numero: String(numero),
        expira: resultado.reservaExpiraEm,
      });
      router.push(`/sorteios/${id}/pagamento?${parametros.toString()}`);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar essa cota.');
      setReservando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Detalhe do sorteio" title="Escolha sua cota" />

      <TicketCard tone="night">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Reserva</p>
        <p className="mt-1 text-sm text-white/80">
          Ao escolher um número, você reserva a cota por um tempo limitado para concluir o
          pagamento via Pix, cartão ou cashback.
        </p>
      </TicketCard>

      {erro && <Alert tone="error">{erro}</Alert>}

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Número da cota</p>
        <p className="text-xs text-muted">
          Este ambiente ainda não expõe quais números já estão vendidos — ao confirmar, o sistema
          valida a disponibilidade em tempo real.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField
            label="Digite o número desejado"
            type="number"
            min={1}
            value={numeroDigitado}
            onChange={(evento) => {
              setNumeroDigitado(evento.target.value);
              setNumeroSelecionado(Number(evento.target.value) || null);
            }}
            className="sm:max-w-[180px]"
          />
          <Button
            onClick={() => numeroSelecionado && reservar(numeroSelecionado)}
            disabled={!numeroSelecionado}
            loading={reservando}
            className="sm:mb-0.5"
          >
            Reservar cota {numeroSelecionado ?? ''}
          </Button>
        </div>
      </Card>
    </div>
  );
}

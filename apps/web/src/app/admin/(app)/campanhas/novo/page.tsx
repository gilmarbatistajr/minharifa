'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Spinner } from '../../../../../components/ui/Spinner';
import { TextField, TextAreaField, SelectField, CheckboxField } from '../../../../../components/ui/Field';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { IconArrowLeft } from '../../../../../components/ui/icons';
import { campanhasApi, premiosApi, ApiError, type Premio, type FormaVendaCotas } from '../../../../../lib/api';
import { formatarMoeda, formatarTelefone } from '../../../../../lib/format';
import { useSessaoAdministrador } from '../../../../../lib/auth';

const OPCOES_EXPIRACAO_RESERVA: { valor: string; label: string }[] = [
  { valor: 'SEM_EXPIRACAO', label: 'Sem expiração automática' },
  { valor: '5', label: '5 minutos' },
  { valor: '10', label: '10 minutos' },
  { valor: '30', label: '30 minutos' },
  { valor: '60', label: '1 hora' },
  { valor: '120', label: '2 horas' },
];

export default function NovaCampanhaPage() {
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();

  const [premios, setPremios] = useState<Premio[] | null>(null);

  // Informações básicas
  const [nome, setNome] = useState('');
  const [telefoneSuporte, setTelefoneSuporte] = useState('');
  const [descricao, setDescricao] = useState('');

  // Cotas
  const [quantidadeCotas, setQuantidadeCotas] = useState('100');
  const [valorCota, setValorCota] = useState('');

  // Forma de venda das cotas
  const [formaVenda, setFormaVenda] = useState<FormaVendaCotas>('ESCOLHA_NUMERO');
  const [quantidadeMinimaPorCompra, setQuantidadeMinimaPorCompra] = useState('1');
  const [quantidadeMaximaPorCompra, setQuantidadeMaximaPorCompra] = useState('');
  const [expiracaoReservaMinutos, setExpiracaoReservaMinutos] = useState('5');
  const [reservaExigeEmail, setReservaExigeEmail] = useState(true);
  const [reservaExigeNome, setReservaExigeNome] = useState(true);
  const [reservaExigeTelefone, setReservaExigeTelefone] = useState(true);
  const [reservaExigeConfirmacaoTelefone, setReservaExigeConfirmacaoTelefone] = useState(false);

  // Prêmios
  const [premioIds, setPremioIds] = useState<string[]>([]);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!sessao) return;
    premiosApi.listar(sessao.token).then(setPremios);
  }, [sessao]);

  function alternarPremio(premioId: string) {
    setPremioIds((atual) =>
      atual.includes(premioId) ? atual.filter((id) => id !== premioId) : [...atual, premioId],
    );
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!sessao) return;

    setErro(null);
    setCarregando(true);
    try {
      const resultado = await campanhasApi.criar(sessao.token, {
        nome,
        descricao,
        telefoneSuporte,
        premioIds,
        quantidadeCotas: Number(quantidadeCotas),
        valorCota: Number(valorCota),
        formaVenda,
        quantidadeMinimaPorCompra: Number(quantidadeMinimaPorCompra),
        quantidadeMaximaPorCompra: quantidadeMaximaPorCompra ? Number(quantidadeMaximaPorCompra) : null,
        expiracaoReservaMinutos:
          expiracaoReservaMinutos === 'SEM_EXPIRACAO' ? null : Number(expiracaoReservaMinutos),
        reservaExigeEmail,
        reservaExigeNome,
        reservaExigeTelefone,
        reservaExigeConfirmacaoTelefone,
      });
      router.push(`/admin/campanhas/${resultado.campanhaId}`);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível criar a campanha.');
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push('/admin/campanhas')}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" /> Voltar para campanhas
      </button>

      <PageHeader
        eyebrow="Nova campanha"
        title="Criar campanha"
        description="Defina o conteúdo da campanha. Ela nasce como rascunho — você revisa e lança para um grupo depois."
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Informações básicas</p>

          <TextField label="Nome da campanha" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <TextField
            label="Telefone para suporte"
            required
            inputMode="numeric"
            placeholder="(11) 91234-5678"
            value={telefoneSuporte}
            onChange={(e) => setTelefoneSuporte(formatarTelefone(e.target.value))}
          />
          <TextAreaField
            label="Descrição / Regulamento"
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Cotas</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Quantidade de cotas"
              type="number"
              min={1}
              required
              value={quantidadeCotas}
              onChange={(e) => setQuantidadeCotas(e.target.value)}
            />
            <TextField
              label="Valor de cada cota (R$)"
              type="number"
              min={0.01}
              step="0.01"
              required
              value={valorCota}
              onChange={(e) => setValorCota(e.target.value)}
              hint={valorCota ? formatarMoeda(Number(valorCota)) : undefined}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Forma de venda das cotas</p>
          <p className="text-xs text-muted">
            Defina como o comprador vai escolher as cotas na tela de compra.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormaVenda('ESCOLHA_NUMERO')}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                formaVenda === 'ESCOLHA_NUMERO'
                  ? 'border-accent-ink bg-accent/20'
                  : 'border-line bg-white hover:border-accent-ink/60'
              }`}
            >
              <p className="text-sm font-semibold text-night">O comprador escolhe os números</p>
              <p className="mt-1 text-xs text-muted">
                Mapa de números disponíveis; o comprador seleciona manualmente (mínimo 1).
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFormaVenda('LOTE_FECHADO')}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                formaVenda === 'LOTE_FECHADO'
                  ? 'border-accent-ink bg-accent/20'
                  : 'border-line bg-white hover:border-accent-ink/60'
              }`}
            >
              <p className="text-sm font-semibold text-night">Lotes fechados</p>
              <p className="mt-1 text-xs text-muted">
                O comprador escolhe apenas a quantidade; os números são sorteados pelo sistema.
              </p>
            </button>
          </div>

          <div className="h-px bg-line" />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Quantidade mínima de cotas por compra"
              type="number"
              min={1}
              required
              value={quantidadeMinimaPorCompra}
              onChange={(e) => setQuantidadeMinimaPorCompra(e.target.value)}
            />
            <TextField
              label="Quantidade máxima de cotas por compra"
              type="number"
              min={1}
              value={quantidadeMaximaPorCompra}
              onChange={(e) => setQuantidadeMaximaPorCompra(e.target.value)}
              hint="Deixe em branco para não limitar."
            />
          </div>

          <SelectField
            label="Expiração da reserva"
            value={expiracaoReservaMinutos}
            onChange={(e) => setExpiracaoReservaMinutos(e.target.value)}
            hint="Tempo que o comprador tem para pagar antes da cota voltar a ficar disponível."
          >
            {OPCOES_EXPIRACAO_RESERVA.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
          </SelectField>

          <div className="h-px bg-line" />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-night">Dados obrigatórios para reserva</p>
            <p className="text-xs text-muted">
              Escolha quais informações o comprador precisa preencher para reservar uma cota.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckboxField
                label="Email"
                checked={reservaExigeEmail}
                onChange={(e) => setReservaExigeEmail(e.target.checked)}
              />
              <CheckboxField
                label="Nome"
                checked={reservaExigeNome}
                onChange={(e) => setReservaExigeNome(e.target.checked)}
              />
              <CheckboxField
                label="Telefone"
                checked={reservaExigeTelefone}
                onChange={(e) => setReservaExigeTelefone(e.target.checked)}
              />
              <CheckboxField
                label="Confirmação do telefone"
                checked={reservaExigeConfirmacaoTelefone}
                onChange={(e) => setReservaExigeConfirmacaoTelefone(e.target.checked)}
              />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-night">Prêmios</p>
          <p className="text-xs text-muted">
            Selecione um ou mais prêmios já cadastrados que serão sorteados aqui.
          </p>

          {premios === null && (
            <div className="flex justify-center py-6 text-muted">
              <Spinner size={18} />
            </div>
          )}

          {premios?.length === 0 && (
            <EmptyState
              title="Nenhum prêmio cadastrado"
              description="Cadastre um prêmio em Prêmios antes de criar uma campanha."
              action={
                <Button variant="secondary" onClick={() => router.push('/admin/premios')} type="button">
                  Ir para Prêmios
                </Button>
              }
            />
          )}

          <div className="flex flex-col gap-2">
            {premios?.map((premio) => (
              <div
                key={premio.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
              >
                <CheckboxField
                  label={premio.nome}
                  checked={premioIds.includes(premio.id)}
                  onChange={() => alternarPremio(premio.id)}
                />
                <span className="font-mono text-xs text-muted">{formatarMoeda(premio.valor)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Button type="submit" loading={carregando} disabled={premioIds.length === 0}>
          Criar campanha
        </Button>
      </form>
    </div>
  );
}

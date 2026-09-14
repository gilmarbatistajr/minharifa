'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../../../components/ui/PageHeader';
import { Card } from '../../../../../../../components/ui/Card';
import { Button } from '../../../../../../../components/ui/Button';
import { Alert } from '../../../../../../../components/ui/Alert';
import { Spinner } from '../../../../../../../components/ui/Spinner';
import { TextField, TextAreaField, CheckboxField } from '../../../../../../../components/ui/Field';
import { EmptyState } from '../../../../../../../components/ui/EmptyState';
import { IconArrowLeft } from '../../../../../../../components/ui/icons';
import { gruposApi, premiosApi, ApiError, type Premio } from '../../../../../../../lib/api';
import { formatarMoeda } from '../../../../../../../lib/format';
import { useSessaoAdministrador } from '../../../../../../../lib/auth';

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export default function NovoSorteioPage() {
  const { id: grupoId } = useParams<{ id: string }>();
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();

  const [premios, setPremios] = useState<Premio[] | null>(null);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [premioIds, setPremioIds] = useState<string[]>([]);
  const [quantidadeCotas, setQuantidadeCotas] = useState('100');
  const [valorCota, setValorCota] = useState('');
  const [dataAberturaVendas, setDataAberturaVendas] = useState(daquiA(0));
  const [dataEncerramentoVendas, setDataEncerramentoVendas] = useState(daquiA(30));
  const [dataRealizacao, setDataRealizacao] = useState(daquiA(31));

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
      const resultado = await gruposApi.cadastrarSorteio(sessao.token, grupoId, {
        nome,
        descricao,
        premioIds,
        quantidadeCotas: Number(quantidadeCotas),
        valorCota: Number(valorCota),
        dataAberturaVendas: new Date(dataAberturaVendas).toISOString(),
        dataEncerramentoVendas: new Date(dataEncerramentoVendas).toISOString(),
        dataRealizacao: new Date(dataRealizacao).toISOString(),
      });
      router.push(`/admin/grupos/${grupoId}?sorteioCriado=${resultado.sorteioId}`);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível criar o sorteio.');
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push(`/admin/grupos/${grupoId}`)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" /> Voltar para o grupo
      </button>

      <PageHeader
        eyebrow="Novo sorteio"
        title="Criar sorteio"
        description="Defina as cotas, o valor e os prêmios que serão sorteados para este grupo."
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <TextField label="Nome do sorteio" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <TextAreaField
            label="Descrição"
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

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
              description="Cadastre um prêmio em Prêmios antes de criar um sorteio."
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

        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Datas</p>
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
        </Card>

        <Button type="submit" loading={carregando} disabled={premioIds.length === 0}>
          Criar sorteio
        </Button>
      </form>
    </div>
  );
}

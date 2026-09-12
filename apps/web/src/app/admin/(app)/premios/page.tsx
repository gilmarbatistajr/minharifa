'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { TextField, TextAreaField } from '../../../../components/ui/Field';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconGift, IconPlus } from '../../../../components/ui/icons';
import { premiosApi, ApiError, type Premio } from '../../../../lib/api';
import { formatarMoeda } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

export default function ListaPremiosPage() {
  const { sessao } = useSessaoAdministrador();
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [premioEmEdicao, setPremioEmEdicao] = useState<Premio | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function recarregar() {
    if (!sessao) return;
    premiosApi.listar(sessao.token).then(setPremios);
  }

  useEffect(recarregar, [sessao]);

  const editando = mostrarFormulario || premioEmEdicao !== null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Prêmios"
        description="Cadastre os itens que serão vinculados aos seus sorteios."
        action={
          !editando && (
            <Button onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Novo prêmio
            </Button>
          )
        }
      />

      {editando && (
        <FormularioPremio
          token={sessao?.token}
          premio={premioEmEdicao}
          aoConcluir={() => {
            setMostrarFormulario(false);
            setPremioEmEdicao(null);
            recarregar();
          }}
          aoCancelar={() => {
            setMostrarFormulario(false);
            setPremioEmEdicao(null);
          }}
        />
      )}

      {premios === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {premios?.length === 0 && !editando && (
        <EmptyState
          title="Nenhum prêmio cadastrado"
          description="Cadastre o item que vai sortear para vincular a um sorteio."
          action={
            <Button className="mt-2" onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Cadastrar prêmio
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {premios?.map((premio) => (
          <Card key={premio.id} className="flex flex-col gap-3">
            <div className="relative h-32 w-full overflow-hidden rounded-xl bg-mist">
              {premio.fotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- fotos de prêmio vêm de qualquer host externo
                <img src={premio.fotoUrl} alt={premio.nome} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-night">{premio.nome}</p>
                <p className="line-clamp-2 text-xs text-muted">{premio.descricao}</p>
              </div>
              <IconGift className="h-5 w-5 shrink-0 text-muted" />
            </div>
            <p className="font-display text-xl text-night">{formatarMoeda(premio.valor)}</p>
            {premio.valorOpcaoDinheiro && (
              <p className="text-xs text-muted">
                Opção em dinheiro: {formatarMoeda(premio.valorOpcaoDinheiro)}
              </p>
            )}
            <Button variant="secondary" onClick={() => setPremioEmEdicao(premio)}>
              Editar
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FormularioPremio({
  token,
  premio,
  aoConcluir,
  aoCancelar,
}: {
  token?: string;
  premio: Premio | null;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState(premio?.nome ?? '');
  const [descricao, setDescricao] = useState(premio?.descricao ?? '');
  const [fotoUrl, setFotoUrl] = useState(premio?.fotoUrl ?? '');
  const [valor, setValor] = useState(premio ? String(premio.valor) : '');
  const [valorOpcaoDinheiro, setValorOpcaoDinheiro] = useState(
    premio?.valorOpcaoDinheiro ? String(premio.valorOpcaoDinheiro) : '',
  );
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      const dados = {
        nome,
        descricao,
        fotoUrl,
        valor: Number(valor),
        valorOpcaoDinheiro: valorOpcaoDinheiro ? Number(valorOpcaoDinheiro) : undefined,
      };
      if (premio) {
        await premiosApi.editar(token, premio.id, dados);
      } else {
        await premiosApi.cadastrar(token, dados);
      }
      aoConcluir();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível salvar o prêmio.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}

        <TextField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <TextAreaField
          label="Descrição"
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <TextField
          label="URL da foto"
          required
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <TextField
            label="Opção em dinheiro (R$, opcional)"
            type="number"
            step="0.01"
            min="0"
            value={valorOpcaoDinheiro}
            onChange={(e) => setValorOpcaoDinheiro(e.target.value)}
            hint="Vencedor pode escolher receber esse valor via Pix em vez do prêmio físico."
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={carregando}>
            {premio ? 'Salvar alterações' : 'Cadastrar prêmio'}
          </Button>
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

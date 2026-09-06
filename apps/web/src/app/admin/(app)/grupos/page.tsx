'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { TextField } from '../../../../components/ui/Field';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconChevronRight, IconGroup, IconPlus, IconWhatsapp } from '../../../../components/ui/icons';
import { gruposApi, ApiError, type Grupo } from '../../../../lib/api';
import { formatarData } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

export default function ListaGruposPage() {
  const { sessao } = useSessaoAdministrador();
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function recarregar() {
    if (!sessao) return;
    gruposApi.listar(sessao.token).then(setGrupos);
  }

  useEffect(recarregar, [sessao]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Multi-tenant"
        title="Meus grupos"
        description="Cada grupo de WhatsApp tem seus próprios compradores e sorteios."
        action={
          !mostrarFormulario && (
            <Button onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Novo grupo
            </Button>
          )
        }
      />

      {mostrarFormulario && (
        <FormularioNovoGrupo
          token={sessao?.token}
          aoCriar={() => {
            setMostrarFormulario(false);
            recarregar();
          }}
          aoCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {grupos === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {grupos?.length === 0 && !mostrarFormulario && (
        <EmptyState
          title="Nenhum grupo cadastrado"
          description="Cadastre o grupo de WhatsApp onde os sorteios serão divulgados."
          action={
            <Button className="mt-2" onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Criar meu primeiro grupo
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {grupos?.map((grupo) => (
          <Link key={grupo.id} href={`/admin/grupos/${grupo.id}`}>
            <Card className="flex items-center justify-between gap-4 transition hover:border-night/30">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist text-muted">
                  <IconGroup className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-night">{grupo.nome}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <IconWhatsapp className="h-3.5 w-3.5" /> {grupo.identificadorWhatsapp}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="hidden text-xs sm:inline">desde {formatarData(grupo.criadoEm)}</span>
                <IconChevronRight className="h-5 w-5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FormularioNovoGrupo({
  token,
  aoCriar,
  aoCancelar,
}: {
  token?: string;
  aoCriar: () => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState('');
  const [identificadorWhatsapp, setIdentificadorWhatsapp] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      await gruposApi.cadastrar(token, { nome, identificadorWhatsapp });
      aoCriar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível cadastrar o grupo.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nome do grupo" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <TextField
            label="Identificador do WhatsApp"
            required
            placeholder="5511999999999"
            value={identificadorWhatsapp}
            onChange={(e) => setIdentificadorWhatsapp(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={carregando}>
            Cadastrar grupo
          </Button>
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

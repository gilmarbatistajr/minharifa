'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { TextField } from '../../../../components/ui/Field';
import { Spinner } from '../../../../components/ui/Spinner';
import { administradoresApi, ApiError, type ContaAdministrador } from '../../../../lib/api';
import { formatarData } from '../../../../lib/format';
import { useAuth, useSessaoAdministrador } from '../../../../lib/auth';

export default function ContaAdministradorPage() {
  const { sessao } = useSessaoAdministrador();
  const { sair } = useAuth();
  const [conta, setConta] = useState<ContaAdministrador | null>(null);

  function recarregar() {
    if (!sessao) return;
    administradoresApi.minhaConta(sessao.token).then(setConta);
  }

  useEffect(recarregar, [sessao]);

  if (!conta) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Sua conta" title={conta.nome} />

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-night">{conta.email}</p>
          <p className="text-xs text-muted">membro desde {formatarData(conta.criadoEm)}</p>
        </div>
        <Badge tone={conta.emailConfirmado ? 'accent' : 'warning'}>
          {conta.emailConfirmado ? 'E-mail confirmado' : 'E-mail não confirmado'}
        </Badge>
      </Card>

      <FormNome token={sessao?.token} nomeAtual={conta.nome} aoAtualizar={recarregar} />
      <FormSenha token={sessao?.token} />
      <FormEmail token={sessao?.token} emailAtual={conta.email} />

      <Card>
        <Button variant="danger" onClick={sair}>
          Encerrar sessão
        </Button>
      </Card>
    </div>
  );
}

function FormNome({ token, nomeAtual, aoAtualizar }: { token?: string; nomeAtual: string; aoAtualizar: () => void }) {
  const [nome, setNome] = useState(nomeAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setSucesso(false);
    setCarregando(true);
    try {
      await administradoresApi.atualizarNome(token, nome);
      setSucesso(true);
      aoAtualizar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível atualizar o nome.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Nome</p>
        {erro && <Alert tone="error">{erro}</Alert>}
        {sucesso && <Alert tone="success">Nome atualizado.</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="flex-1" />
          <Button type="submit" loading={carregando}>
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function FormSenha({ token }: { token?: string }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setSucesso(false);
    setCarregando(true);
    try {
      await administradoresApi.alterarSenha(token, { senhaAtual, novaSenha });
      setSenhaAtual('');
      setNovaSenha('');
      setSucesso(true);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível alterar a senha.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Alterar senha</p>
        {erro && <Alert tone="error">{erro}</Alert>}
        {sucesso && <Alert tone="success">Senha alterada com sucesso.</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Senha atual"
            type="password"
            required
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
          <TextField
            label="Nova senha"
            type="password"
            minLength={8}
            required
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
        </div>
        <Button type="submit" loading={carregando} className="self-start">
          Alterar senha
        </Button>
      </form>
    </Card>
  );
}

function FormEmail({ token, emailAtual }: { token?: string; emailAtual: string }) {
  const [novoEmail, setNovoEmail] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setSucesso(false);
    setCarregando(true);
    try {
      await administradoresApi.solicitarTrocaEmail(token, novoEmail);
      setSucesso(true);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível solicitar a troca de e-mail.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Trocar e-mail</p>
        <p className="text-xs text-muted">
          E-mail atual: {emailAtual}. A troca exige confirmação por um link enviado ao novo e-mail.
        </p>
        {erro && <Alert tone="error">{erro}</Alert>}
        {sucesso && <Alert tone="success">Enviamos um link de confirmação para o novo e-mail.</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField
            label="Novo e-mail"
            type="email"
            required
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={carregando}>
            Solicitar troca
          </Button>
        </div>
      </form>
    </Card>
  );
}

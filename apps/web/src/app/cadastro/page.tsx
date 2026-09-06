'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { TextField, CheckboxField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { compradoresApi, gruposApi, ApiError } from '../../lib/api';
import { formatarCpf, formatarTelefone } from '../../lib/format';
import { useAuth } from '../../lib/auth';

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoConvite = searchParams.get('convite');
  const { entrarComoComprador } = useAuth();

  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [resolvendoConvite, setResolvendoConvite] = useState(Boolean(codigoConvite));
  const [erroConvite, setErroConvite] = useState<string | null>(null);
  const [codigoManual, setCodigoManual] = useState('');

  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitouTermo, setAceitouTermo] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!codigoConvite) {
      setResolvendoConvite(false);
      return;
    }

    gruposApi
      .validarCodigoConvite(codigoConvite)
      .then((resultado) => setGrupoId(resultado.grupoId))
      .catch((excecao) =>
        setErroConvite(excecao instanceof ApiError ? excecao.message : 'Código de convite inválido.'),
      )
      .finally(() => setResolvendoConvite(false));
  }, [codigoConvite]);

  async function resolverCodigoManual(evento: FormEvent) {
    evento.preventDefault();
    setErroConvite(null);
    setResolvendoConvite(true);
    try {
      const resultado = await gruposApi.validarCodigoConvite(codigoManual.trim());
      setGrupoId(resultado.grupoId);
    } catch (excecao) {
      setErroConvite(excecao instanceof ApiError ? excecao.message : 'Código de convite inválido.');
    } finally {
      setResolvendoConvite(false);
    }
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!grupoId) return;

    setErro(null);
    setCarregando(true);
    try {
      await compradoresApi.cadastrar({
        grupoId,
        nome,
        apelido: apelido || undefined,
        dataNascimento,
        telefone,
        cpf,
        endereco,
        email: email || undefined,
        senha: senha || undefined,
        aceitouTermo,
      });

      if (email && senha) {
        const sessao = await compradoresApi.login({ email, senha });
        entrarComoComprador(sessao);
        router.push('/sorteios');
      } else {
        router.push('/entrar');
      }
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setCarregando(false);
    }
  }

  if (resolvendoConvite) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted">
        <Spinner size={18} /> Validando convite...
      </div>
    );
  }

  if (!grupoId) {
    return (
      <form onSubmit={resolverCodigoManual} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          O cadastro é feito a partir do link de convite do grupo de WhatsApp. Se você já tem o
          código, informe-o abaixo.
        </p>
        {erroConvite && <Alert tone="error">{erroConvite}</Alert>}
        <TextField
          label="Código de convite"
          required
          value={codigoManual}
          onChange={(evento) => setCodigoManual(evento.target.value)}
        />
        <Button type="submit" fullWidth loading={resolvendoConvite}>
          Continuar
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      {erro && <Alert tone="error">{erro}</Alert>}

      <TextField label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
      <TextField label="Apelido (opcional)" value={apelido} onChange={(e) => setApelido(e.target.value)} />
      <TextField
        label="Data de nascimento"
        type="date"
        required
        value={dataNascimento}
        onChange={(e) => setDataNascimento(e.target.value)}
      />
      <TextField
        label="Telefone"
        required
        inputMode="numeric"
        placeholder="(11) 91234-5678"
        value={telefone}
        onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
      />
      <TextField
        label="CPF"
        required
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => setCpf(formatarCpf(e.target.value))}
      />
      <TextField label="Endereço completo" required value={endereco} onChange={(e) => setEndereco(e.target.value)} />

      <div className="h-px bg-line" />
      <p className="text-xs text-muted">
        Opcional: cadastre e-mail e senha para entrar direto sem passar pelo link de convite da
        próxima vez.
      </p>
      <TextField label="E-mail (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        label="Senha (opcional)"
        type="password"
        minLength={8}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <CheckboxField
        checked={aceitouTermo}
        onChange={(e) => setAceitouTermo(e.target.checked)}
        label={
          <>
            Li e aceito o termo de consentimento sobre a retenção dos meus dados para participar
            dos sorteios deste grupo.
          </>
        }
      />

      <Button type="submit" fullWidth loading={carregando} disabled={!aceitouTermo}>
        Concluir cadastro
      </Button>
    </form>
  );
}

export default function CadastroCompradorPage() {
  return (
    <AuthLayout
      eyebrow="Área do comprador"
      title="Criar conta"
      subtitle="Preencha seus dados para participar dos sorteios do grupo."
      footer={
        <>
          Já tem conta?{' '}
          <Link href="/entrar" className="font-semibold">
            Entrar
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <CadastroForm />
      </Suspense>
    </AuthLayout>
  );
}

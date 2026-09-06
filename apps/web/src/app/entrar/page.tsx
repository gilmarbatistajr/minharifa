'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { TextField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { compradoresApi, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function LoginCompradorPage() {
  const router = useRouter();
  const { entrarComoComprador } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [avisoSocial, setAvisoSocial] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resultado = await compradoresApi.login({ email, senha });
      entrarComoComprador(resultado);
      router.push('/sorteios');
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Área do comprador"
      title="Entrar"
      subtitle="Acesse sua conta para ver os sorteios que você tem acesso."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold">
            Criar usuário
          </Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
        />

        <Link href="/recuperar-senha" className="-mt-2 self-end text-xs font-medium">
          Esqueci minha senha
        </Link>

        <Button type="submit" fullWidth loading={carregando}>
          Entrar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        ou continue com
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['Google', 'Apple', 'Facebook'].map((provedor) => (
          <button
            key={provedor}
            type="button"
            onClick={() => setAvisoSocial(`Login com ${provedor} em breve.`)}
            className="rounded-xl border border-line bg-white py-2.5 text-xs font-semibold text-night transition hover:border-night/30"
          >
            {provedor}
          </button>
        ))}
      </div>
      {avisoSocial && <Alert tone="info">{avisoSocial}</Alert>}
    </AuthLayout>
  );
}

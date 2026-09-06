'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { TextField } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { administradoresApi, ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

export default function LoginAdministradorPage() {
  const router = useRouter();
  const { entrarComoAdministrador } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resultado = await administradoresApi.login({ email, senha });
      entrarComoAdministrador(resultado);
      router.push('/admin/dashboard');
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Painel administrativo"
      title="Entrar"
      subtitle="Gerencie seus grupos, prêmios e sorteios."
      footer={
        <>
          Ainda não tem uma conta de administrador?{' '}
          <Link href="/admin/cadastro" className="font-semibold">
            Cadastre-se
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

        <Link href="/admin/recuperar-senha" className="-mt-2 self-end text-xs font-medium">
          Esqueci minha senha
        </Link>

        <Button type="submit" fullWidth loading={carregando}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}

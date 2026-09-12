'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { TextField } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { administradoresApi, ApiError } from '../../../lib/api';

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await administradoresApi.redefinirSenha({ token, novaSenha });
      router.push('/admin/entrar');
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível redefinir sua senha.');
    } finally {
      setCarregando(false);
    }
  }

  if (!token) {
    return (
      <Alert tone="error">
        Este link de redefinição é inválido. Solicite um novo em{' '}
        <Link href="/admin/recuperar-senha" className="font-semibold">
          recuperação de senha
        </Link>
        .
      </Alert>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      {erro && <Alert tone="error">{erro}</Alert>}
      <TextField
        label="Nova senha"
        type="password"
        minLength={8}
        required
        value={novaSenha}
        onChange={(evento) => setNovaSenha(evento.target.value)}
      />
      <Button type="submit" fullWidth loading={carregando}>
        Redefinir senha
      </Button>
    </form>
  );
}

export default function RedefinirSenhaAdministradorPage() {
  return (
    <AuthLayout eyebrow="Painel administrativo" title="Redefinir senha">
      <Suspense fallback={null}>
        <RedefinirSenhaForm />
      </Suspense>
    </AuthLayout>
  );
}

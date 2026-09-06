'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { Alert } from '../../../components/ui/Alert';
import { Spinner } from '../../../components/ui/Spinner';
import { administradoresApi, ApiError } from '../../../lib/api';

function Conteudo() {
  const token = useSearchParams().get('token') ?? '';
  const [estado, setEstado] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('erro');
      setMensagem('Link de confirmação inválido.');
      return;
    }
    administradoresApi
      .confirmarEmail(token)
      .then(() => setEstado('sucesso'))
      .catch((excecao) => {
        setEstado('erro');
        setMensagem(excecao instanceof ApiError ? excecao.message : 'Não foi possível confirmar seu e-mail.');
      });
  }, [token]);

  if (estado === 'carregando') {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner size={18} /> Confirmando...
      </div>
    );
  }

  if (estado === 'sucesso') {
    return (
      <Alert tone="success">
        E-mail confirmado! Você já pode criar sorteios.{' '}
        <Link href="/admin/entrar" className="font-semibold">
          Ir para o login
        </Link>
      </Alert>
    );
  }

  return <Alert tone="error">{mensagem}</Alert>;
}

export default function ConfirmarEmailPage() {
  return (
    <AuthLayout eyebrow="Painel administrativo" title="Confirmação de e-mail">
      <Suspense fallback={null}>
        <Conteudo />
      </Suspense>
    </AuthLayout>
  );
}

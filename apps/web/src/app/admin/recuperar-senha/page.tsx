'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { TextField } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { administradoresApi } from '../../../lib/api';

export default function RecuperarSenhaAdministradorPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    try {
      await administradoresApi.recuperarSenha(email);
    } finally {
      setCarregando(false);
      setEnviado(true);
    }
  }

  return (
    <AuthLayout
      eyebrow="Painel administrativo"
      title="Recuperar senha"
      footer={
        <Link href="/admin/entrar" className="font-semibold">
          Voltar para o login
        </Link>
      }
    >
      {enviado ? (
        <Alert tone="success">
          Se esse e-mail estiver cadastrado, enviamos um link de redefinição de senha para ele.
        </Alert>
      ) : (
        <form onSubmit={aoEnviar} className="flex flex-col gap-4">
          <TextField
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
          />
          <Button type="submit" fullWidth loading={carregando}>
            Enviar link de redefinição
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

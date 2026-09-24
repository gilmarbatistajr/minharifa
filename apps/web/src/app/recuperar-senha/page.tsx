'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { TextField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { compradoresApi } from '../../lib/api';

export default function RecuperarSenhaCompradorPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    try {
      await compradoresApi.recuperarSenha(email);
    } finally {
      setCarregando(false);
      setEnviado(true);
    }
  }

  return (
    <AuthLayout
      eyebrow="Área do comprador"
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta para receber o link de redefinição."
      footer={
        <Link href="/entrar" className="font-semibold">
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
            autoComplete="email"
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

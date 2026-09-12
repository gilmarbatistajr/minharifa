'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { TextField } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { administradoresApi, ApiError } from '../../../lib/api';

export default function CadastroAdministradorPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await administradoresApi.cadastrar({ nome, email, senha });
      setConcluido(true);
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Painel administrativo"
      title="Criar conta"
      subtitle="Cadastre-se para organizar sorteios para o seu grupo de WhatsApp."
      footer={
        <>
          Já tem conta?{' '}
          <Link href="/admin/entrar" className="font-semibold">
            Entrar
          </Link>
        </>
      }
    >
      {concluido ? (
        <Alert tone="success">
          Conta criada! Enviamos um link de confirmação para o seu e-mail — confirme para liberar a
          criação de sorteios.{' '}
          <Link href="/admin/entrar" className="font-semibold">
            Ir para o login
          </Link>
        </Alert>
      ) : (
        <form onSubmit={aoEnviar} className="flex flex-col gap-4">
          {erro && <Alert tone="error">{erro}</Alert>}

          <TextField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <Button type="submit" fullWidth loading={carregando}>
            Criar conta
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

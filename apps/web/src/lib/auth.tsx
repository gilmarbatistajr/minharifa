'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SessaoAdministrador {
  tipo: 'administrador';
  token: string;
  administradorId: string;
  nome: string;
}

export interface SessaoComprador {
  tipo: 'comprador';
  token: string;
  compradorId: string;
  nome: string;
}

export type Sessao = SessaoAdministrador | SessaoComprador | null;

const CHAVE_STORAGE = 'minharifa:sessao';

interface AuthContextValue {
  sessao: Sessao;
  pronto: boolean;
  entrarComoAdministrador: (dados: Omit<SessaoAdministrador, 'tipo'>) => void;
  entrarComoComprador: (dados: Omit<SessaoComprador, 'tipo'>) => void;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Sessao>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_STORAGE);
      if (bruto) {
        setSessao(JSON.parse(bruto));
      }
    } catch {
      // localStorage indisponível (modo privado, etc) — segue sem sessão.
    } finally {
      setPronto(true);
    }
  }, []);

  const persistir = (proxima: Sessao) => {
    setSessao(proxima);
    try {
      if (proxima) {
        window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(proxima));
      } else {
        window.localStorage.removeItem(CHAVE_STORAGE);
      }
    } catch {
      // ignora falha de storage
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      sessao,
      pronto,
      entrarComoAdministrador: (dados) => persistir({ tipo: 'administrador', ...dados }),
      entrarComoComprador: (dados) => persistir({ tipo: 'comprador', ...dados }),
      sair: () => persistir(null),
    }),
    [sessao, pronto],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  }
  return contexto;
}

export function useAuth(): AuthContextValue {
  return useAuthContext();
}

/** Redireciona para o login de administrador se não houver sessão de admin válida. */
export function useSessaoAdministrador(): { sessao: SessaoAdministrador | null; pronto: boolean } {
  const { sessao, pronto } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (pronto && sessao?.tipo !== 'administrador') {
      router.replace('/admin/entrar');
    }
  }, [pronto, sessao, router]);

  return { sessao: sessao?.tipo === 'administrador' ? sessao : null, pronto };
}

/** Redireciona para o login de comprador se não houver sessão de comprador válida. */
export function useSessaoComprador(): { sessao: SessaoComprador | null; pronto: boolean } {
  const { sessao, pronto } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (pronto && sessao?.tipo !== 'comprador') {
      router.replace('/entrar');
    }
  }, [pronto, sessao, router]);

  return { sessao: sessao?.tipo === 'comprador' ? sessao : null, pronto };
}

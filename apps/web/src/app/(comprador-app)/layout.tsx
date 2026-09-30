'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { Logo } from '../../components/ui/Logo';
import { IconTicket, IconUser } from '../../components/ui/icons';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth, useSessaoCompradorOpcional } from '../../lib/auth';

const NAV_ITEMS = [
  { href: '/campanhas', label: 'Campanhas', icon: IconTicket },
  { href: '/conta', label: 'Conta', icon: IconUser },
];

// Dois caminhos funcionam sem login: o Link de Vendas de uma campanha
// específica (/campanhas/<id>) e, só quando carrega o token da reserva feita
// como convidado (?tokenConvidado=), a própria página de pagamento — ver
// ReservarLoteCotasConvidadoUseCase/reservarComoConvidado. A lista
// (/campanhas) continua exigindo conta.
const REGEX_CAMPANHA_PUBLICA = /^\/campanhas\/[^/]+$/;
const REGEX_PAGAMENTO = /^\/campanhas\/[^/]+\/pagamento$/;

export default function CompradorAppLayout({ children }: { children: React.ReactNode }) {
  const { sessao, pronto } = useSessaoCompradorOpcional();
  const { sair } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const temTokenConvidado = Boolean(searchParams.get('tokenConvidado'));
  const permiteAnonimo =
    REGEX_CAMPANHA_PUBLICA.test(pathname ?? '') ||
    (REGEX_PAGAMENTO.test(pathname ?? '') && temTokenConvidado);

  useEffect(() => {
    if (pronto && !sessao && !permiteAnonimo) {
      router.replace('/entrar');
    }
  }, [pronto, sessao, permiteAnonimo, router]);

  if (!pronto || (!sessao && !permiteAnonimo)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mist text-muted">
        <Spinner />
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="min-h-dvh bg-mist">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <Logo size="sm" />
          <Link href="/entrar" className="text-sm font-semibold text-accent-ink">
            Já tenho conta
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">{children}</main>
      </div>
    );
  }

  return (
    <AppShell navItems={NAV_ITEMS} nome={sessao.nome} onSair={sair}>
      {children}
    </AppShell>
  );
}

'use client';

import { AppShell } from '../../components/layout/AppShell';
import { IconTicket, IconUser } from '../../components/ui/icons';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth, useSessaoComprador } from '../../lib/auth';

const NAV_ITEMS = [
  { href: '/sorteios', label: 'Sorteios', icon: IconTicket },
  { href: '/conta', label: 'Conta', icon: IconUser },
];

export default function CompradorAppLayout({ children }: { children: React.ReactNode }) {
  const { sessao, pronto } = useSessaoComprador();
  const { sair } = useAuth();

  if (!pronto || !sessao) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mist text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell navItems={NAV_ITEMS} nome={sessao.nome} onSair={sair}>
      {children}
    </AppShell>
  );
}

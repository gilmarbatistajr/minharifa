'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { IconDashboard, IconTicket, IconGift, IconGroup, IconBell, IconUser } from '../../../components/ui/icons';
import { Spinner } from '../../../components/ui/Spinner';
import { useAuth, useSessaoAdministrador } from '../../../lib/auth';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/admin/campanhas', label: 'Campanhas', icon: IconTicket },
  { href: '/admin/grupos', label: 'Grupos', icon: IconGroup },
  { href: '/admin/premios', label: 'Prêmios', icon: IconGift },
  { href: '/admin/alertas', label: 'Alertas automáticos', icon: IconBell },
  { href: '/admin/conta', label: 'Conta', icon: IconUser },
];

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { sessao, pronto } = useSessaoAdministrador();
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

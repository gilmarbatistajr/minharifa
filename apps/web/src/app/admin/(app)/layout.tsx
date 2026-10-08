'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import {
  IconDashboard,
  IconTicket,
  IconGift,
  IconGroup,
  IconBell,
  IconInbox,
  IconUser,
  IconHeadset,
  IconShield,
} from '../../../components/ui/icons';
import { Spinner } from '../../../components/ui/Spinner';
import { useAuth, useSessaoAdministrador } from '../../../lib/auth';
import { notificacoesApi } from '../../../lib/api';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/admin/campanhas', label: 'Campanhas', icon: IconTicket },
  { href: '/admin/notificacoes', label: 'Notificações', icon: IconInbox },
  { href: '/admin/grupos', label: 'Grupos', icon: IconGroup },
  { href: '/admin/premios', label: 'Prêmios', icon: IconGift },
  { href: '/admin/operadores', label: 'Operadores', icon: IconHeadset },
  { href: '/admin/administradores', label: 'Administradores', icon: IconShield },
  { href: '/admin/alertas', label: 'Alertas automáticos', icon: IconBell },
  { href: '/admin/conta', label: 'Conta', icon: IconUser },
];

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { sessao, pronto } = useSessaoAdministrador();
  const { sair } = useAuth();
  const naoLidas = useNotificacoesNaoLidas(sessao?.token);
  const pathname = usePathname();

  // Contador também no título da aba, como num cliente de e-mail: "(3) Minha Rifa".
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, '');
    document.title = naoLidas > 0 ? `(${naoLidas > 99 ? '99+' : naoLidas}) ${base}` : base;
  }, [naoLidas, pathname]);

  if (!pronto || !sessao) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mist text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell
      navItems={NAV_ITEMS.map((item) => (item.href === '/admin/notificacoes' ? { ...item, badge: naoLidas } : item))} nome={sessao.nome} onSair={sair}>
      {children}
    </AppShell>
  );
}

const INTERVALO_NOTIFICACOES_MS = 30_000;

/** Contador de notificações não lidas para o menu — atualiza a cada 30 s e quando a aba volta a ficar visível. */
function useNotificacoesNaoLidas(token: string | undefined): number {
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    if (!token) return;
    let ativo = true;

    function atualizar() {
      notificacoesApi
        .listar(token!)
        .then((lista) => ativo && setNaoLidas(lista.naoLidas))
        .catch(() => {
          // contador é só um indicador — falha de rede não deve atrapalhar o painel.
        });
    }

    atualizar();
    const intervalo = setInterval(atualizar, INTERVALO_NOTIFICACOES_MS);
    window.addEventListener('focus', atualizar);
    window.addEventListener('notificacoes:atualizadas', atualizar);
    return () => {
      ativo = false;
      clearInterval(intervalo);
      window.removeEventListener('focus', atualizar);
      window.removeEventListener('notificacoes:atualizadas', atualizar);
    };
  }, [token]);

  return naoLidas;
}

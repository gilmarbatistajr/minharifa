'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../ui/Logo';
import { IconLogout } from '../ui/icons';

export interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

interface AppShellProps {
  navItems: NavItem[];
  nome: string;
  onSair: () => void;
  children: React.ReactNode;
}

function itemAtivo(pathname: string, href: string): boolean {
  return href === pathname || (href !== '/' && pathname.startsWith(href));
}

export function AppShell({ navItems, nome, onSair, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-mist md:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-night px-5 py-6 text-white md:flex">
        <Link href={navItems[0]?.href ?? '/'}>
          <Logo tone="light" size="sm" />
        </Link>

        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const ativo = itemAtivo(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  ativo ? 'bg-accent text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3">
          <span className="truncate text-sm text-white/80">{nome}</span>
          <button
            onClick={onSair}
            aria-label="Sair"
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-night px-4 py-3 text-white md:hidden">
        <Logo tone="light" size="sm" />
        <button
          onClick={onSair}
          aria-label="Sair"
          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <IconLogout className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1">
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-10 md:pb-10 md:pt-10">
          {children}
        </main>
      </div>

      {/* Tab bar — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-white py-2 md:hidden">
        {navItems.map((item) => {
          const ativo = itemAtivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] font-medium ${
                ativo ? 'text-accent-ink' : 'text-muted'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

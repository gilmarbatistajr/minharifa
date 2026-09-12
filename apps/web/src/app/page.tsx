import Link from 'next/link';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { IconGroup, IconTicket, IconUser } from '../components/ui/icons';

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-night text-white">
      <header className="flex justify-center px-6 pb-10 pt-14">
        <Logo tone="light" size="lg" />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pb-20 text-center">
        <p className="max-w-md text-balance text-white/70">
          Sorteios por cotas numeradas para o seu grupo de WhatsApp — cadastro, cobrança e
          resultado, tudo em um só lugar.
        </p>

        <div className="grid w-full max-w-sm gap-3">
          <Link href="/entrar" className="block">
            <Button fullWidth className="justify-between px-6 py-4 text-base">
              <span className="flex items-center gap-2">
                <IconTicket className="h-5 w-5" /> Sou comprador
              </span>
              <span aria-hidden>→</span>
            </Button>
          </Link>

          <Link href="/admin/entrar" className="block">
            <Button fullWidth variant="outline-light" className="justify-between px-6 py-4 text-base">
              <span className="flex items-center gap-2">
                <IconGroup className="h-5 w-5" /> Sou administrador
              </span>
              <span aria-hidden>→</span>
            </Button>
          </Link>
        </div>

        <p className="text-xs text-white/40">
          Recebeu um link de convite de um sorteio pelo WhatsApp? Abra-o diretamente para ir para o cadastro.
        </p>
      </main>

      <footer className="flex justify-center gap-2 pb-10 text-xs text-white/30">
        <IconUser className="h-3.5 w-3.5" />
        <span>Minha Rifa — plataforma de sorteios online</span>
      </footer>
    </div>
  );
}

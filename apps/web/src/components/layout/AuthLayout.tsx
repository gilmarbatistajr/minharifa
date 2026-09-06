import Link from 'next/link';
import { Logo } from '../ui/Logo';

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-night">
      <div className="flex justify-center px-6 pb-8 pt-10">
        <Link href="/">
          <Logo tone="light" size="md" />
        </Link>
      </div>

      <div className="flex flex-1 justify-center px-4 pb-10">
        <div className="w-full max-w-md rounded-t-[28px] bg-mist px-6 pb-10 pt-8 sm:rounded-[28px] sm:px-8">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{eyebrow}</span>
          <h1 className="mt-1.5 font-display text-3xl leading-none text-night">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}

          <div className="mt-6 flex flex-col gap-4">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

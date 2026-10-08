export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</div>
  );
}

/**
 * Card com o motivo "bilhete recortado" — mordidas circulares nas laterais
 * que revelam o fundo por trás do card (a página, quase sempre `bg-mist`).
 * Se o card estiver sobre um fundo escuro, passe `notchOnDark`.
 */
export function TicketCard({
  children,
  className = '',
  tone = 'night',
  notchOnDark = false,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'night' | 'accent' | 'white';
  notchOnDark?: boolean;
}) {
  const tons: Record<string, string> = {
    night: 'bg-night text-white',
    accent: 'bg-accent text-ink',
    white: 'bg-white text-night border border-line',
  };

  return (
    <div
      className={`ticket-notch ${notchOnDark ? 'ticket-notch-night' : ''} rounded-[20px] p-6 ${tons[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

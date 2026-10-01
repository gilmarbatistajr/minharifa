type Tom = 'neutral' | 'accent' | 'warning' | 'danger' | 'night';

const TONS: Record<Tom, string> = {
  neutral: 'bg-mist text-muted-strong border border-line',
  accent: 'bg-accent/15 text-accent-ink border border-accent/30',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-600 border border-red-200',
  night: 'bg-night text-white',
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tom }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${TONS[tone]}`}
    >
      {children}
    </span>
  );
}

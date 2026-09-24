type Tom = 'error' | 'success' | 'info';

const TONS: Record<Tom, string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-accent/10 text-accent-ink border-accent/30',
  info: 'bg-mist text-muted-strong border-line',
};

export function Alert({ tone = 'info', children }: { tone?: Tom; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${TONS[tone]}`} role="status">
      {children}
    </div>
  );
}

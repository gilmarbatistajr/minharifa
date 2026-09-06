interface LogoProps {
  variant?: 'full' | 'mark';
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const TAMANHOS = {
  sm: { badge: 36, mr: 15, notch: 8, word: 'text-lg', minha: 'text-[9px] tracking-[0.3em]' },
  md: { badge: 52, mr: 21, notch: 12, word: 'text-2xl', minha: 'text-[11px] tracking-[0.32em]' },
  lg: { badge: 104, mr: 40, notch: 22, word: 'text-6xl', minha: 'text-2xl tracking-[0.34em]' },
};

/** Marca "Minha Rifa" — bloco de bilhete recortado (badge com mordidas
 * circulares) + wordmark em pesos opostos, extraído de Minha Rifa Logo.html. */
export function Logo({ variant = 'full', tone = 'dark', size = 'md' }: LogoProps) {
  const t = TAMANHOS[size];
  const corTexto = tone === 'dark' ? 'text-night' : 'text-white';
  const corNotch = tone === 'dark' ? 'bg-mist' : 'bg-night';

  const badge = (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-[28%] bg-accent"
      style={{ width: t.badge, height: t.badge }}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 rounded-full ${corNotch}`}
        style={{ width: t.notch, height: t.notch, left: -t.notch / 2 }}
      />
      <span
        className={`absolute top-1/2 -translate-y-1/2 rounded-full ${corNotch}`}
        style={{ width: t.notch, height: t.notch, right: -t.notch / 2 }}
      />
      <span
        className="font-display leading-none text-ink"
        style={{ fontSize: t.mr, letterSpacing: '-0.04em' }}
      >
        MR
      </span>
    </div>
  );

  if (variant === 'mark') {
    return badge;
  }

  return (
    <div className="flex items-center gap-3">
      {badge}
      <div className="flex flex-col leading-none">
        <span className={`font-medium uppercase ${t.minha} ${corTexto}`}>Minha</span>
        <span className={`font-display leading-[0.9] ${t.word} ${corTexto}`} style={{ letterSpacing: '-0.045em' }}>
          RIFA<span className="text-accent">.</span>
        </span>
      </div>
    </div>
  );
}

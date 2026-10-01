'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-light';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANTES: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:brightness-95 active:brightness-90',
  secondary: 'bg-white text-night border border-line hover:border-night/30',
  ghost: 'bg-transparent text-night hover:bg-night/5',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  'outline-light': 'bg-transparent text-white border border-white/25 hover:border-white/50',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, fullWidth = false, disabled, className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold',
        'transition disabled:cursor-not-allowed disabled:opacity-60',
        fullWidth ? 'w-full' : '',
        VARIANTES[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
});

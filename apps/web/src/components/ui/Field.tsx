import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { IconChevronDown, IconEye, IconEyeOff } from './icons';

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, error, hint, children }: FieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-night">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

const inputClasses =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-night placeholder:text-muted ' +
  'outline-none transition focus:border-accent-ink focus:ring-2 focus:ring-accent/30 disabled:bg-mist';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, className = '', type, onWheel, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input
        ref={ref}
        type={type}
        className={`${inputClasses} ${error ? 'border-red-400' : ''} ${className}`}
        // Inputs numéricos focados mudam de valor ao rolar a página com a
        // roda do mouse (comportamento nativo do Chrome) — isso já causou
        // um valor errado sem o usuário perceber, então tiramos o foco
        // para o scroll da página passar batido em vez de alterar o campo.
        onWheel={type === 'number' ? (evento) => evento.currentTarget.blur() : onWheel}
        {...props}
      />
    </FieldWrapper>
  );
});

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
}

/** Campo de senha com botão de "olho" para mostrar/ocultar o texto digitado. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, hint, className = '', ...props },
  ref,
) {
  const [visivel, setVisivel] = useState(false);

  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          ref={ref}
          type={visivel ? 'text' : 'password'}
          className={`${inputClasses} pr-11 ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-night"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {visivel ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
        </button>
      </div>
    </FieldWrapper>
  );
});

interface PhoneFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Campo de telefone no modo Brasil: o "+55" fica fixo, só o DDD + número é editável. */
export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { label, error, hint, className = '', ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <div
        className={`flex items-stretch overflow-hidden rounded-xl border bg-white transition focus-within:border-accent-ink focus-within:ring-2 focus-within:ring-accent/30 ${
          error ? 'border-red-400' : 'border-line'
        }`}
      >
        <span className="flex shrink-0 items-center border-r border-line bg-mist px-3 font-mono text-[15px] text-muted">
          +55
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          className={`w-full bg-white px-4 py-3 text-[15px] text-night placeholder:text-muted outline-none disabled:bg-mist ${className}`}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, hint, className = '', ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea ref={ref} className={`${inputClasses} min-h-24 resize-y ${className}`} {...props} />
    </FieldWrapper>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, className = '', children, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          ref={ref}
          className={`${inputClasses} appearance-none pr-11 leading-[1.5] ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldWrapper>
  );
});

export function CheckboxField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-night">
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-line text-accent-ink accent-accent-ink"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

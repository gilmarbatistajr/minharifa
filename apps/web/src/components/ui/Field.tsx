import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

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
  { label, error, hint, className = '', ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input ref={ref} className={`${inputClasses} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
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
      <select ref={ref} className={`${inputClasses} ${className}`} {...props}>
        {children}
      </select>
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

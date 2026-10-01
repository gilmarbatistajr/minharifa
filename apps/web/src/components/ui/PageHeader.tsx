export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{eyebrow}</span>
        )}
        <h1 className="font-display text-3xl leading-none text-night sm:text-4xl">{title}</h1>
        {description && <p className="max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

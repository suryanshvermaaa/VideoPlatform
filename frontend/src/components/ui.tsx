import type { PropsWithChildren } from 'react';

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
      {children}
    </div>
  );
}

export function CardHeader({ children }: PropsWithChildren) {
  return <div className="border-b border-[hsl(var(--border))] p-4">{children}</div>;
}

export function CardBody({ children }: PropsWithChildren) {
  return <div className="p-4">{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[hsl(var(--muted-fg))] ${
        props.className ?? ''
      }`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[hsl(var(--muted-fg))] ${
        props.className ?? ''
      }`}
    />
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }
) {
  const variant = props.variant ?? 'primary';
  const base = 'rounded-xl px-3 py-2 text-sm transition disabled:opacity-60';
  const styles =
    variant === 'primary'
      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-fg))] hover:opacity-90'
      : 'border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))]';

  return <button {...props} className={`${base} ${styles} ${props.className ?? ''}`} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[hsl(var(--muted))] ${className ?? ''}`} />;
}

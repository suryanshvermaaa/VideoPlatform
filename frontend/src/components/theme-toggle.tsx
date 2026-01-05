'use client';

import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;

  return (
    <button
      type="button"
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm transition hover:bg-[hsl(var(--muted))]"
      aria-label="Toggle theme"
    >
      {current === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}

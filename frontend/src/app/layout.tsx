import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'VideoPlatform',
  description: 'Admin-controlled video course platform'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

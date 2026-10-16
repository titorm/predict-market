import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'PredictMarket — Economize nas Compras de Supermercado com Dados Reais',
  description:
    'Escaneie notas fiscais pelo QR Code, acompanhe o preço real de cada produto e descubra em qual supermercado sua lista sai mais barata.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e4d3b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-canvas text-ink min-h-screen flex flex-col pb-16 md:pb-0"
      >
        <ToastProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <BottomNav />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

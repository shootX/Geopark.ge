import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GeoPark — Smart Parking in Tbilisi',
  description:
    'Discover and book premium parking spots across Tbilisi. Real-time availability, secure payments, effortless parking.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'GeoPark — Smart Parking Made Premium',
    description: 'Find and book parking spots instantly in Tbilisi',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'GeoPark',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GeoPark',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" className={inter.variable}>
      <body className="font-sans antialiased bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

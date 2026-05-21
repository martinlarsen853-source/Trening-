import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { PushSubscriber } from '@/components/PushSubscriber';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Beitostølen Timeplan',
  description: 'Ukentlig aktivitetsplan – meld avbud og sjekk inn i fellesrom',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        <ServiceWorkerRegistrar />
        <PushSubscriber />
        <NavBar />
        <main className="pt-14 pb-6 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

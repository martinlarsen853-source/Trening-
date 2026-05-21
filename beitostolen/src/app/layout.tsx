import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { PushSubscriber } from '@/components/PushSubscriber';

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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-700 text-white h-14 flex items-center px-4 shadow-md">
          <span className="font-bold text-lg tracking-tight">Beitostølen</span>
          <div className="ml-auto flex gap-4 text-sm font-medium">
            <a href="/" className="hover:text-blue-200 transition-colors">Timeplan</a>
            <a href="/fritid" className="hover:text-blue-200 transition-colors">Fritid</a>
            <a href="/mat" className="hover:text-blue-200 transition-colors">Mat</a>
            <a href="/fellesrom" className="hover:text-blue-200 transition-colors">Fellesrom</a>
            <a href="https://ombudsmann-6u0j9kup8-martins-projects-f84ff334.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition-colors">Ombudsmann</a>
          </div>
        </nav>
        <main className="pt-14 pb-6 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { PushSubscriber } from '@/components/PushSubscriber';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Beitostølen 2C',
  description: 'Ukentlig aktivitetsplan – meld avbud og sjekk inn i fellesrom',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a1f4e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        <ServiceWorkerRegistrar />
        <PushSubscriber />

        {/* Hero header */}
        <header className="relative overflow-hidden" style={{background: 'linear-gradient(160deg, #0a1f4e 0%, #0e3a8c 45%, #1a6fc4 80%, #38a0e8 100%)'}}>
          {/* Snow dots */}
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px'}} />

          {/* Mountain silhouette */}
          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,90 L0,60 L80,30 L160,55 L260,15 L360,45 L460,20 L560,50 L660,10 L760,40 L860,18 L960,45 L1060,22 L1160,48 L1280,20 L1360,42 L1440,25 L1440,90 Z" fill="white" fillOpacity="0.07"/>
            <path d="M0,90 L0,72 L120,48 L240,65 L380,38 L500,58 L620,35 L740,55 L880,32 L1000,52 L1120,38 L1240,55 L1360,40 L1440,52 L1440,90 Z" fill="white" fillOpacity="0.09"/>
            <path d="M0,90 L0,80 L180,62 L360,75 L540,55 L720,70 L900,52 L1080,68 L1260,58 L1440,65 L1440,90 Z" fill="white" fillOpacity="0.12"/>
          </svg>

          {/* Text content */}
          <div className="relative z-10 px-5 pt-7 pb-10">
            <p className="text-[11px] font-bold tracking-[0.22em] text-blue-200 uppercase mb-1.5">
              Beitostølen Helsesportsenter
            </p>
            <div className="flex items-end gap-3">
              <h1 className="text-[2.75rem] font-black text-white leading-none tracking-tight">
                Gruppe 2C
              </h1>
              <span className="mb-1 text-lg font-semibold text-blue-300 leading-none">2025/26</span>
            </div>
          </div>
        </header>

        <NavBar />

        <main className="pb-8 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Treningsdashboard',
  description: 'Personlig treningsanalyse med AI for Martin',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1117',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className="h-full">
      <body className="min-h-full bg-[#0f1117] text-gray-100 antialiased">
        <Navbar />
        {/* Padding top for desktop nav, padding bottom for mobile nav */}
        <main className="md:pt-14 pb-16 md:pb-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

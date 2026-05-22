'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './NavBar';
import { WeatherWidget } from './WeatherWidget';

const AUTH_PATHS = ['/login', '/signup'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) return <>{children}</>;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <header
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.3) 25%, rgba(255,255,255,.3) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.3) 75%, rgba(255,255,255,.3) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.3) 25%, rgba(255,255,255,.3) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.3) 75%, rgba(255,255,255,.3) 76%, transparent 77%)', backgroundSize: '60px 60px' }}
          />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />
          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,70 L0,45 L90,18 L180,38 L290,8 L400,32 L500,12 L600,36 L700,6 L800,28 L900,10 L1000,34 L1100,14 L1200,38 L1320,12 L1440,28 L1440,70 Z" fill="white" fillOpacity="0.06"/>
            <path d="M0,70 L0,55 L160,35 L320,52 L480,28 L640,48 L800,24 L960,44 L1120,30 L1280,46 L1440,34 L1440,70 Z" fill="white" fillOpacity="0.08"/>
            <path d="M0,70 L0,63 L240,48 L480,60 L720,44 L960,58 L1200,46 L1440,56 L1440,70 Z" fill="white" fillOpacity="0.12"/>
          </svg>
          <div className="relative z-10 px-5 pt-5 pb-8 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] text-blue-300 uppercase mb-1">Beitostølen Helsesportsenter</p>
              <h1 className="text-[2.4rem] font-black text-white leading-none tracking-tight drop-shadow-sm">Gruppe 2C</h1>
            </div>
            <WeatherWidget />
          </div>
        </header>
        <NavBar />
      </div>
      <main className="pt-[172px] pb-8 min-h-screen">
        {children}
      </main>
    </>
  );
}

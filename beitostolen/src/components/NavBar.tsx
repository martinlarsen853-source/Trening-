'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, Calendar, Utensils, MessageCircle,
  MoreHorizontal, Map, Home, Users, Settings, ExternalLink,
} from 'lucide-react';

const MAIN_TABS = [
  { href: '/',          label: 'Status',    Icon: Activity },
  { href: '/timeplan',  label: 'Timeplan',  Icon: Calendar },
  { href: '/fellesrom', label: 'Fellesrom', Icon: Home },
  { href: '/chat',      label: 'Chat',      Icon: MessageCircle },
] as const;

const MORE_LINKS = [
  { href: '/kart',        label: 'Kart',         Icon: Map,          external: false },
  { href: '/mat',         label: 'Mat',           Icon: Utensils,     external: false },
  { href: '/ansatte',     label: 'Ansatte',       Icon: Users,        external: false },
  { href: 'https://ombudsmann-6u0j9kup8-martins-projects-f84ff334.vercel.app',
                          label: 'Ombudsmann',    Icon: ExternalLink, external: true  },
  { href: '/innstillinger', label: 'Innstillinger', Icon: Settings,   external: false },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_LINKS.some(l => !l.external && pathname === l.href);

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md border-t border-gray-100"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -1px 16px rgba(0,0,0,0.07)',
          touchAction: 'manipulation',
        }}
      >
        <div className="flex max-w-lg mx-auto">
          {MAIN_TABS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-[3px] py-2.5 select-none transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-bold leading-none">{label}</span>
              </Link>
            );
          })}

          {/* Mer */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`flex-1 flex flex-col items-center gap-[3px] py-2.5 select-none transition-colors ${
              isMoreActive || moreOpen ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <MoreHorizontal size={24} strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold leading-none">Mer</span>
          </button>
        </div>
      </nav>

      {/* Mer-drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-lg mx-auto"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="grid grid-cols-4 gap-y-5 gap-x-2 px-6 pb-2">
              {MORE_LINKS.map(({ href, label, Icon, external }) => {
                const active = !external && pathname === href;
                const inner = (
                  <>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                      active ? 'bg-blue-50' : 'bg-gray-50'
                    }`}>
                      <Icon size={22} className={active ? 'text-blue-600' : 'text-gray-500'} />
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight mt-1.5 block ${
                      active ? 'text-blue-600' : 'text-gray-600'
                    }`}>{label}</span>
                  </>
                );

                return external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center"
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const links = [
  { href: '/', label: 'Timeplan' },
  { href: '/mat', label: 'Mat' },
  { href: '/fellesrom', label: 'Fellesrom' },
  { href: '/chat', label: 'Chat' },
  { href: 'https://ombudsmann-6u0j9kup8-martins-projects-f84ff334.vercel.app', label: 'Ombudsmann', external: true },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide px-1 max-w-lg mx-auto">
        {links.map((l) => {
          const active = !l.external && pathname === l.href;
          return (
            <a
              key={l.href}
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`flex-shrink-0 px-3 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                active
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {l.label}
            </a>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex-shrink-0 ml-auto px-3 py-3 text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors border-b-2 border-transparent whitespace-nowrap"
        >
          Logg ut
        </button>
      </div>
    </nav>
  );
}

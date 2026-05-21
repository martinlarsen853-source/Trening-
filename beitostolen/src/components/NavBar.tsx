'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/', label: 'Timeplan' },
  { href: '/fritid', label: 'Fritid' },
  { href: '/mat', label: 'Mat' },
  { href: '/fellesrom', label: 'Fellesrom' },
  { href: 'https://ombudsmann-6u0j9kup8-martins-projects-f84ff334.vercel.app', label: 'Ombudsmann', external: true },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-700 text-white h-14 flex items-center px-4 shadow-md">
        <span className="font-bold text-lg tracking-tight flex-shrink-0">Beitostølen</span>

        {/* Desktop links */}
        <div className="ml-auto hidden sm:flex gap-5 text-sm font-medium">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="hover:text-blue-200 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="ml-auto sm:hidden p-2 -mr-2 rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Meny"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-blue-700 border-t border-blue-600 shadow-lg sm:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => setOpen(false)}
              className="flex items-center px-5 py-4 text-white font-medium hover:bg-blue-600 transition-colors border-b border-blue-600/50 last:border-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

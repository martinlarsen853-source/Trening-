'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  BarChart2,
  FileText,
  ClipboardCheck,
  Upload,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trening', label: 'Trening', icon: Activity },
  { href: '/analyse', label: 'Analyse', icon: BarChart2 },
  { href: '/rapporter', label: 'Rapporter', icon: FileText },
  { href: '/checkin', label: 'Check-in', icon: ClipboardCheck },
  { href: '/upload', label: 'Last opp', icon: Upload },
  { href: '/innstillinger', label: 'Innstillinger', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar for desktop */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 h-14 items-center px-6 gap-1">
        <span className="font-bold text-white mr-6 text-sm tracking-wide">TRENINGSDASHBOARD</span>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800">
        <div className="grid grid-cols-7 h-14">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                pathname === href ? 'text-blue-400' : 'text-gray-500'
              )}
            >
              <Icon size={18} />
              <span className="text-[9px] leading-tight text-center">{label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

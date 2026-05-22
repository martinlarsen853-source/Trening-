'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isPublic = PUBLIC_PATHS.includes(window.location.pathname);
      setAuthed(!!session);
      if (!session && !isPublic) router.replace('/login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const isPublic = PUBLIC_PATHS.includes(window.location.pathname);
      setAuthed(!!session);
      if (!session && !isPublic) router.replace('/login');
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
  if (!authed) return null;
  return <>{children}</>;
}

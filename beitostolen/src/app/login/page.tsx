'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function login() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: 'martinwoldlarsen@gmail.com',
      password: 'admin2026',
    });
    setLoading(false);
    if (err) { setError(err.message); }
    else { router.replace('/'); }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-5"
      style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}
    >
      <div className="mb-10 text-center">
        <p className="text-[10px] font-bold tracking-[0.28em] text-blue-300 uppercase mb-1">
          Beitostølen Helsesportsenter
        </p>
        <h1 className="text-3xl font-black text-white leading-none tracking-tight">Gruppe 2C</h1>
      </div>

      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

      <button
        onClick={login}
        disabled={loading}
        className="w-full max-w-xs rounded-3xl bg-white text-blue-700 font-black text-lg py-5 shadow-2xl active:scale-95 transition-all disabled:opacity-60"
      >
        {loading ? 'Logger inn…' : 'Logg inn'}
      </button>
    </div>
  );
}

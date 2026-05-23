'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('martinwoldlarsen@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function login() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.replace('/');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-5"
      style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}
    >
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.28em] text-blue-300 uppercase mb-1">
          Beitostølen Helsesportsenter
        </p>
        <h1 className="text-3xl font-black text-white leading-none tracking-tight">Gruppe 2C</h1>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-post"
          className="w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3.5 text-sm outline-none focus:border-white/60"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Passord"
          autoFocus
          className="w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3.5 text-sm outline-none focus:border-white/60"
        />

        {error && (
          <p className="text-red-300 text-xs text-center px-2">{error}</p>
        )}

        <button
          onClick={login}
          disabled={loading || !email || !password}
          className="w-full rounded-3xl bg-white text-blue-700 font-black text-lg py-4 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Logger inn…' : 'Logg inn'}
        </button>
      </div>
    </div>
  );
}

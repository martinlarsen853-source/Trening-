'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Passordet må være minst 6 tegn.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace('/');
    }
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-auto flex flex-col items-center justify-center px-5 pb-10"
      style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}>
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.28em] text-blue-300 uppercase mb-1">
          Beitostølen Helsesportsenter
        </p>
        <h1 className="text-3xl font-black text-white leading-none tracking-tight">Gruppe 2C</h1>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Opprett konto</h2>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Ditt navn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="password"
            placeholder="Passord (min. 6 tegn)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 text-white font-bold py-3 text-sm mt-1 disabled:opacity-60 active:scale-95 transition-all"
          >
            {loading ? 'Oppretter konto…' : 'Opprett konto'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Har du konto?{' '}
          <a href="/login" className="text-blue-600 font-semibold">Logg inn</a>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';

type Step = 'role' | 'group' | 'child' | 'staff';

const STAFF_CODE = 'BHS-STAB';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [groupCode, setGroupCode] = useState('');
  const [childCode, setChildCode] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [staffName, setStaffName] = useState('');
  const [groupData, setGroupData] = useState<{ id: string; label: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Step 1: validate group code ── */
  async function handleGroupCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data } = await supabase
      .from('groups')
      .select('id, label')
      .eq('access_code', groupCode.trim().toUpperCase())
      .eq('status', 'aktiv')
      .maybeSingle();
    setLoading(false);
    if (!data) { setError('Ugyldig gruppekode — sjekk at du har tastet riktig.'); return; }
    setGroupData(data as { id: string; label: string });
    setStep('child');
  }

  /* ── Step 2a: validate child code ── */
  async function handleChildLogin(e: FormEvent) {
    e.preventDefault();
    if (!groupData) return;
    setError('');
    setLoading(true);
    const { data } = await supabase
      .from('children')
      .select('id, name')
      .eq('group_id', groupData.id)
      .eq('access_password', childCode.trim().toUpperCase())
      .maybeSingle();
    setLoading(false);
    if (!data) { setError('Ugyldig kode — sjekk at du har tastet riktig.'); return; }
    const child = data as { id: string; name: string };
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('childName', child.name);
    localStorage.setItem('childId', child.id);
    localStorage.setItem('groupId', groupData.id);
    localStorage.setItem('groupName', `Gruppe ${groupData.label}`);
    localStorage.removeItem('lederMode');
    router.replace('/');
  }

  /* ── Step 2b: staff login ── */
  function handleStaffLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (staffCode.trim().toUpperCase() !== STAFF_CODE) {
      setError('Ugyldig stab-kode.');
      return;
    }
    if (!staffName.trim()) { setError('Skriv inn ditt navn.'); return; }
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lederMode', 'true');
    localStorage.setItem('staffName', staffName.trim());
    localStorage.removeItem('childId');
    router.replace('/');
  }

  /* ── Demo quick-access ── */
  async function quickLoginStudent() {
    setLoading(true);
    const { data: group } = await supabase
      .from('groups').select('id, label').eq('status', 'aktiv').order('label').limit(1).single();
    if (group) {
      const { data: child } = await supabase
        .from('children').select('id, name').eq('group_id', (group as { id: string; label: string }).id).order('name').limit(1).single();
      if (child) {
        const g = group as { id: string; label: string };
        const c = child as { id: string; name: string };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('childName', c.name);
        localStorage.setItem('childId', c.id);
        localStorage.setItem('groupId', g.id);
        localStorage.setItem('groupName', `Gruppe ${g.label}`);
        localStorage.removeItem('lederMode');
        router.replace('/');
        return;
      }
    }
    setLoading(false);
    setError('Ingen barn funnet i databasen.');
  }

  function quickLoginAdmin() {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lederMode', 'true');
    localStorage.setItem('staffName', 'Admin');
    localStorage.removeItem('childId');
    router.replace('/');
  }

  const inputCls = 'w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base font-semibold text-gray-900 outline-none focus:border-blue-500 placeholder:text-gray-300 transition-colors';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-5 pb-10 overflow-auto"
      style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-white leading-none tracking-tight drop-shadow-sm">
          Beitostølen
        </h1>
        <p className="text-[10px] font-bold tracking-[0.28em] text-blue-300 uppercase mt-2">
          Helsesportsenter
        </p>
        <p className="text-blue-200 text-sm mt-3">Oppholdsapp for barn og ledsagere</p>
      </div>

      <div className="w-full max-w-sm">

        {/* ── Role selection ── */}
        {step === 'role' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep('group')}
              className="w-full bg-white rounded-3xl px-6 py-5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform"
            >
              <div className="text-left">
                <p className="text-lg font-black text-gray-900">Student</p>
                <p className="text-sm text-gray-500 mt-0.5">Logg inn med din tilgangskode</p>
              </div>
              <ChevronRight size={22} className="text-blue-500 flex-shrink-0" />
            </button>

            <button
              onClick={() => setStep('staff')}
              className="w-full bg-white/10 border border-white/20 rounded-3xl px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="text-left">
                <p className="text-lg font-black text-white">Ansatt</p>
                <p className="text-sm text-blue-200 mt-0.5">Logg inn med stab-kode</p>
              </div>
              <ChevronRight size={22} className="text-blue-300 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* ── Group code entry ── */}
        {step === 'group' && (
          <form onSubmit={handleGroupCode} className="flex flex-col gap-4">
            <button type="button" onClick={() => { setStep('role'); setError(''); }} className="flex items-center gap-1 text-blue-200 text-sm mb-1">
              <ArrowLeft size={15} />Tilbake
            </button>
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Steg 1 av 2</p>
              <p className="text-xl font-black text-gray-900 mb-4">Skriv inn gruppekode</p>
              <input
                type="text"
                value={groupCode}
                onChange={e => setGroupCode(e.target.value)}
                placeholder="F.eks. BHS-2C-2026"
                autoCapitalize="characters"
                className={inputCls}
              />
              {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading || !groupCode.trim()}
                className="w-full mt-4 py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Sjekker…' : 'Neste →'}
              </button>
            </div>
          </form>
        )}

        {/* ── Child code entry ── */}
        {step === 'child' && groupData && (
          <form onSubmit={handleChildLogin} className="flex flex-col gap-4">
            <button type="button" onClick={() => { setStep('group'); setError(''); }} className="flex items-center gap-1 text-blue-200 text-sm mb-1">
              <ArrowLeft size={15} />Tilbake
            </button>
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Steg 2 av 2</p>
              <p className="text-xl font-black text-gray-900 mb-1">Barnets kode</p>
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                ✓ Gruppe {groupData.label}
              </div>
              <input
                type="text"
                value={childCode}
                onChange={e => setChildCode(e.target.value)}
                placeholder="F.eks. GWQPA9"
                autoCapitalize="characters"
                className={inputCls + ' font-mono tracking-widest text-lg'}
              />
              {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading || !childCode.trim()}
                className="w-full mt-4 py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Logger inn…' : 'Logg inn'}
              </button>
            </div>
          </form>
        )}

        {/* ── Staff login ── */}
        {step === 'staff' && (
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => { setStep('role'); setError(''); }} className="flex items-center gap-1 text-blue-200 text-sm mb-1">
              <ArrowLeft size={15} />Tilbake
            </button>

            {/* Quick-access buttons */}
            <button
              onClick={quickLoginAdmin}
              className="w-full bg-white rounded-3xl px-6 py-5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform"
            >
              <div className="text-left">
                <p className="text-lg font-black text-gray-900">🔑 Admin</p>
                <p className="text-sm text-gray-500 mt-0.5">Full leder-tilgang</p>
              </div>
              <ChevronRight size={22} className="text-blue-500 flex-shrink-0" />
            </button>

            <button
              onClick={quickLoginStudent}
              disabled={loading}
              className="w-full bg-white rounded-3xl px-6 py-5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <div className="text-left">
                <p className="text-lg font-black text-gray-900">
                  {loading ? <Loader2 size={18} className="animate-spin inline" /> : '👤'} Student
                </p>
                <p className="text-sm text-gray-500 mt-0.5">Logg inn som barn / ledsager</p>
              </div>
              <ChevronRight size={22} className="text-blue-500 flex-shrink-0" />
            </button>

            {error && <p className="text-red-300 text-sm text-center font-medium">{error}</p>}

            {/* Code form — collapsed by default */}
            <details className="group">
              <summary className="text-center text-blue-200/70 text-xs font-semibold cursor-pointer select-none py-1 list-none">
                Logg inn med stab-kode ↓
              </summary>
              <form onSubmit={handleStaffLogin} className="mt-3">
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={staffName}
                      onChange={e => setStaffName(e.target.value)}
                      placeholder="Ditt navn"
                      className={inputCls}
                    />
                    <input
                      type="password"
                      value={staffCode}
                      onChange={e => setStaffCode(e.target.value)}
                      placeholder="Stab-kode"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!staffName.trim() || !staffCode.trim()}
                    className="w-full mt-4 py-4 rounded-2xl bg-gray-900 text-white font-black text-base disabled:opacity-40 active:scale-95 transition-all"
                  >
                    Logg inn
                  </button>
                </div>
              </form>
            </details>
          </div>
        )}
      </div>

      <p className="text-blue-300/60 text-xs mt-10 text-center">
        Kode mangler? Kontakt lederen for oppholdet.
      </p>
    </div>
  );
}

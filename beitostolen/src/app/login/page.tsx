'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';

type Step = 'code' | 'companion_name' | 'staff';

const STAFF_CODE = 'BHS-STAB';

function deviceType() {
  if (typeof navigator === 'undefined') return 'ukjent';
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobil' : 'desktop';
}

async function logLogin(code: string, entity_type: string, entity_id: string | null) {
  try {
    await supabase.from('login_log').insert({
      code_used: code, entity_type, entity_id, device_type: deviceType(),
    });
  } catch { /* ignore */ }
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [companionName, setCompanionName] = useState('');
  const [pendingCompanion, setPendingCompanion] = useState<{
    companionId: string; childId: string; childName: string; groupId: string; groupLabel: string;
  } | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Single-code login (child or companion) ── */
  async function handleCodeLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const clean = code.trim().toUpperCase();

    try {
      // 1. Check children table
      const { data: child, error: childErr } = await supabase
        .from('children')
        .select('id, name, group_id')
        .eq('access_password', clean)
        .maybeSingle();

      if (childErr) throw childErr;

      if (child) {
        const c = child as { id: string; name: string; group_id: string };
        const { data: grp, error: grpErr } = await supabase
          .from('groups').select('label').eq('id', c.group_id).single();
        if (grpErr) throw grpErr;
        const label = (grp as { label: string } | null)?.label ?? '';
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('childId', c.id);
        localStorage.setItem('childName', c.name);
        localStorage.setItem('groupId', c.group_id);
        localStorage.setItem('groupName', `Gruppe ${label}`);
        localStorage.removeItem('lederMode');
        localStorage.removeItem('staffRole');
        localStorage.removeItem('companionId');
        await logLogin(clean, 'child', c.id);
        setLoading(false);
        router.replace('/');
        return;
      }

      // 2. Check companions table (active only)
      const { data: companion, error: compErr } = await supabase
        .from('companions')
        .select('id, name, child_id')
        .eq('access_password', clean)
        .eq('is_active', true)
        .maybeSingle();

      if (compErr) throw compErr;

      if (companion) {
        const cm = companion as { id: string; name: string; child_id: string };
        const { data: childRow, error: crErr } = await supabase
          .from('children').select('name, group_id').eq('id', cm.child_id).single();
        if (crErr) throw crErr;
        const ch = childRow as { name: string; group_id: string } | null;
        const { data: grp } = await supabase
          .from('groups').select('label').eq('id', ch?.group_id ?? '').single();
        const label = (grp as { label: string } | null)?.label ?? '';

        if (!cm.name) {
          setPendingCompanion({
            companionId: cm.id,
            childId: cm.child_id,
            childName: ch?.name ?? '',
            groupId: ch?.group_id ?? '',
            groupLabel: label,
          });
          setLoading(false);
          setStep('companion_name');
          return;
        }

        await logLogin(clean, 'companion', cm.id);
        finishCompanionLogin(cm.id, cm.name, cm.child_id, ch?.name ?? '', ch?.group_id ?? '', label);
        return;
      }

      setLoading(false);
      setError('Ugyldig kode — sjekk at du har tastet riktig.');
    } catch {
      setLoading(false);
      setError('Kunne ikke nå senteret. Sjekk nettilkoblingen og prøv igjen.');
    }
  }

  /* ── Set companion name on first login ── */
  async function handleCompanionName(e: FormEvent) {
    e.preventDefault();
    if (!pendingCompanion || !companionName.trim()) return;
    setLoading(true);
    try {
      const { error: rpcErr } = await supabase.rpc('set_companion_name', {
        p_companion_id: pendingCompanion.companionId,
        p_name: companionName.trim(),
      });
      if (rpcErr) throw rpcErr;
    } catch {
      setLoading(false);
      setError('Kunne ikke lagre navn. Sjekk nettilkoblingen og prøv igjen.');
      return;
    }
    finishCompanionLogin(
      pendingCompanion.companionId,
      companionName.trim(),
      pendingCompanion.childId,
      pendingCompanion.childName,
      pendingCompanion.groupId,
      pendingCompanion.groupLabel,
    );
  }

  function finishCompanionLogin(
    companionId: string, name: string,
    childId: string, childName: string,
    groupId: string, groupLabel: string,
  ) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('companionId', companionId);
    localStorage.setItem('companionName', name);
    localStorage.setItem('childId', childId);
    localStorage.setItem('childName', childName);
    localStorage.setItem('groupId', groupId);
    localStorage.setItem('groupName', `Gruppe ${groupLabel}`);
    localStorage.removeItem('lederMode');
    localStorage.removeItem('staffRole');
    setLoading(false);
    router.replace('/');
  }

  /* ── Staff login with code ── */
  function handleStaffLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (staffCode.trim().toUpperCase() !== STAFF_CODE) { setError('Ugyldig stab-kode.'); return; }
    if (!staffName.trim()) { setError('Skriv inn ditt navn.'); return; }
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lederMode', 'true');
    localStorage.setItem('staffRole', 'admin');
    localStorage.setItem('staffName', staffName.trim());
    localStorage.removeItem('childId');
    localStorage.removeItem('companionId');
    router.replace('/');
  }

  /* ── Demo quick-access ── */
  function quickLoginAdmin() {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lederMode', 'true');
    localStorage.setItem('staffRole', 'admin');
    localStorage.setItem('staffName', 'Admin');
    localStorage.removeItem('childId');
    localStorage.removeItem('companionId');
    router.replace('/');
  }

  function quickLoginStudent() {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('staffRole', 'student');
    localStorage.setItem('staffName', 'Student');
    localStorage.removeItem('lederMode');
    localStorage.removeItem('childId');
    localStorage.removeItem('companionId');
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

        {/* ── Single code entry (ledsager / barn) ── */}
        {step === 'code' && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleCodeLogin}>
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <label htmlFor="access-code">
                  <p className="text-xl font-black text-gray-900 mb-1">Skriv inn din kode</p>
                  <p className="text-sm text-gray-500 mb-4">Du finner koden på oppslaget fra lederen</p>
                </label>
                <input
                  id="access-code"
                  type="text"
                  inputMode="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="F.eks. GWQPA9"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoFocus
                  className={inputCls + ' font-mono tracking-widest text-2xl text-center'}
                />
                {error && <p className="text-red-500 text-sm mt-2 font-medium text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full mt-4 py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Sjekker…' : 'Logg inn'}
                </button>
              </div>
            </form>

            <button
              onClick={() => { setStep('staff'); setError(''); }}
              className="w-full bg-white/10 border border-white/20 rounded-3xl px-6 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <p className="font-bold text-white">Ansatt</p>
              <ChevronRight size={20} className="text-blue-300" />
            </button>
          </div>
        )}

        {/* ── Companion name on first login ── */}
        {step === 'companion_name' && pendingCompanion && (
          <form onSubmit={handleCompanionName} className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Første innlogging</p>
              <p className="text-xl font-black text-gray-900 mb-1">Hva heter du?</p>
              <p className="text-sm text-gray-500 mb-4">
                Navnet vises til leder og i aktivitetsoversikten.
              </p>
              <input
                type="text"
                value={companionName}
                onChange={e => setCompanionName(e.target.value)}
                placeholder="Ditt fulle navn"
                autoFocus
                className={inputCls}
              />
              <button
                type="submit"
                disabled={loading || !companionName.trim()}
                className="w-full mt-4 py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Lagrer…' : 'Fortsett'}
              </button>
            </div>
          </form>
        )}

        {/* ── Staff / Ansatt ── */}
        {step === 'staff' && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => { setStep('code'); setError(''); }}
              className="flex items-center gap-1 text-blue-200 text-sm mb-1"
            >
              <ArrowLeft size={15} />Tilbake
            </button>

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
              className="w-full bg-white rounded-3xl px-6 py-5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform"
            >
              <div className="text-left">
                <p className="text-lg font-black text-gray-900">👤 Student</p>
                <p className="text-sm text-gray-500 mt-0.5">Kun visning</p>
              </div>
              <ChevronRight size={22} className="text-blue-500 flex-shrink-0" />
            </button>

            {error && <p className="text-red-300 text-sm text-center font-medium">{error}</p>}

            <details>
              <summary className="text-center text-blue-200/70 text-xs font-semibold cursor-pointer select-none py-1 list-none">
                Logg inn med stab-kode ↓
              </summary>
              <form onSubmit={handleStaffLogin} className="mt-3">
                <div className="bg-white rounded-3xl p-6 shadow-xl flex flex-col gap-3">
                  <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)}
                    placeholder="Ditt navn" className={inputCls} />
                  <input type="password" value={staffCode} onChange={e => setStaffCode(e.target.value)}
                    placeholder="Stab-kode" className={inputCls} />
                  <button type="submit" disabled={!staffName.trim() || !staffCode.trim()}
                    className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-base disabled:opacity-40 active:scale-95 transition-all">
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

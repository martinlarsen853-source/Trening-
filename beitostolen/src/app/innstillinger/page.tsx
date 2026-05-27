'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

function Toggle({ on, onToggle, label, description }: {
  on: boolean; onToggle: () => void; label: string; description: string;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-blue-600' : 'bg-gray-200'}`}
        aria-pressed={on}
        aria-label={label}
      >
        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${on ? 'translate-x-8' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

type LoginEntry = { id: string; code_used: string; entity_type: string; device_type: string | null; logged_at: string };

export default function InnstillingerPage() {
  const { dark, largeText, setDark, setLargeText } = useTheme();
  const [role, setRole] = useState<'leder' | 'student' | 'ledsager'>('ledsager');
  const [staffName, setStaffName] = useState('');
  const [showLoginLog, setShowLoginLog] = useState(false);
  const [loginLog, setLoginLog] = useState<LoginEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('lederMode') === 'true') setRole('leder');
    else if (localStorage.getItem('staffRole') === 'student') setRole('student');
    else setRole('ledsager');
    setStaffName(localStorage.getItem('staffName') || '');
  }, []);

  async function loadLoginLog() {
    if (loginLog.length > 0) { setShowLoginLog(v => !v); return; }
    setLoadingLog(true);
    const { data } = await import('@/lib/supabase').then(m => m.supabase.from('login_log')
      .select('id, code_used, entity_type, device_type, logged_at')
      .order('logged_at', { ascending: false }).limit(50));
    setLoginLog((data ?? []) as LoginEntry[]);
    setLoadingLog(false);
    setShowLoginLog(true);
  }

  const isStaff = role === 'leder' || role === 'student';

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Innstillinger</h2>
      <p className="text-sm text-gray-500 mb-6">Visning og tilgjengelighet</p>

      {/* Visning */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 divide-y divide-gray-100 mb-6">
        <Toggle on={dark} onToggle={() => setDark(!dark)} label="Mørk modus" description="Mørk bakgrunn — lettere på øynene i svakt lys" />
        <Toggle on={largeText} onToggle={() => setLargeText(!largeText)} label="Større tekst" description="Øker skriftstørrelsen i hele appen" />
      </div>

      {/* Leder-seksjoner */}
      {role === 'leder' && (
        <>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Lederverktøy</p>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden mb-6">
            <Link href="/innstillinger/barn" className="flex items-center justify-between px-4 py-4 active:bg-gray-50">
              <div>
                <p className="font-semibold text-gray-900">Barn og koder</p>
                <p className="text-sm text-gray-500 mt-0.5">Legg til barn, se og generer tilgangskoder</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
            <Link href="/ansatte" className="flex items-center justify-between px-4 py-4 active:bg-gray-50">
              <div>
                <p className="font-semibold text-gray-900">Ansatte</p>
                <p className="text-sm text-gray-500 mt-0.5">Legg til, rediger eller fjern ansatte</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
            <button onClick={loadLoginLog} className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-50 text-left">
              <div>
                <p className="font-semibold text-gray-900">Kodebruk-logg</p>
                <p className="text-sm text-gray-500 mt-0.5">Se hvem som har logget inn og når</p>
              </div>
              <span className="text-gray-300 text-lg">{loadingLog ? '…' : showLoginLog ? '↑' : '›'}</span>
            </button>
          </div>

          {/* Login log inline */}
          {showLoginLog && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 mb-2">Siste innlogginger</p>
              {loginLog.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 pb-4">Ingen loggede innlogginger</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {loginLog.map(l => (
                    <div key={l.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-bold text-sm text-blue-700">{l.code_used}</p>
                        <p className="text-xs text-gray-400">{l.entity_type} · {l.device_type ?? 'ukjent enhet'}</p>
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">{new Date(l.logged_at).toLocaleString('nb')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Staff name */}
      {isStaff && staffName && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Innlogget som</p>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="font-semibold text-gray-900">{staffName} ({role})</p>
          </div>
        </div>
      )}

      {/* Public info link */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 mb-6">
        <Link href="/info" className="flex items-center justify-between px-4 py-4 active:bg-gray-50">
          <div>
            <p className="font-semibold text-gray-900">Senterinformasjon</p>
            <p className="text-sm text-gray-500 mt-0.5">Åpent for alle — kan deles med familien</p>
          </div>
          <span className="text-gray-300 text-lg">›</span>
        </Link>
      </div>
    </div>
  );
}

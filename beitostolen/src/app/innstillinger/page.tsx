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
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
          on ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        aria-pressed={on}
        aria-label={label}
      >
        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
          on ? 'translate-x-8' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

export default function InnstillingerPage() {
  const { dark, largeText, setDark, setLargeText } = useTheme();
  const [lederMode, setLederMode] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [groupName, setGroupName] = useState('Gruppe 2C');
  const [childName, setChildNameState] = useState('');
  const [parentName, setParentNameState] = useState('');

  useEffect(() => {
    setLederMode(localStorage.getItem('lederMode') === 'true');
    setStaffName(localStorage.getItem('staffName') || '');
    setGroupName(localStorage.getItem('groupName') || 'Gruppe 2C');
    setChildNameState(localStorage.getItem('childName') || 'Evelina');
    setParentNameState(localStorage.getItem('parentName') || 'Martin');
  }, []);

  function handleChildName(val: string) {
    setChildNameState(val);
    if (val.trim()) localStorage.setItem('childName', val.trim());
    else localStorage.removeItem('childName');
  }

  function handleParentName(val: string) {
    setParentNameState(val);
    if (val.trim()) localStorage.setItem('parentName', val.trim());
    else localStorage.removeItem('parentName');
  }

  function toggleLeder(on: boolean) {
    setLederMode(on);
    if (on) localStorage.setItem('lederMode', 'true');
    else localStorage.removeItem('lederMode');
    window.location.reload();
  }

  function handleStaffName(val: string) {
    setStaffName(val);
    if (val.trim()) localStorage.setItem('staffName', val.trim());
    else localStorage.removeItem('staffName');
  }

  function handleGroupName(val: string) {
    setGroupName(val);
    if (val.trim()) localStorage.setItem('groupName', val.trim());
  }

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Innstillinger</h2>
      <p className="text-sm text-gray-500 mb-6">Visning og tilgjengelighet</p>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 divide-y divide-gray-100 mb-4">
        <Toggle
          on={dark}
          onToggle={() => setDark(!dark)}
          label="Mørk modus"
          description="Mørk bakgrunn — lettere på øynene i svakt lys"
        />
        <Toggle
          on={largeText}
          onToggle={() => setLargeText(!largeText)}
          label="Større tekst"
          description="Øker skriftstørrelsen i hele appen"
        />
      </div>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Barnets navn</p>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-3 mb-2">
        <input
          type="text"
          value={childName}
          onChange={e => handleChildName(e.target.value)}
          placeholder="F.eks. Evelina"
          className="w-full text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>
      <p className="text-xs text-gray-400 mb-4 px-1">Brukes i timeplan, avbud og tilpasninger</p>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Foresattes navn</p>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-3 mb-2">
        <input
          type="text"
          value={parentName}
          onChange={e => handleParentName(e.target.value)}
          placeholder="F.eks. Marte Olsen"
          className="w-full text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>
      <p className="text-xs text-gray-400 mb-4 px-1">Brukes i fellesrom og chat</p>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Gruppenavn</p>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
        <input
          type="text"
          value={groupName}
          onChange={e => handleGroupName(e.target.value)}
          placeholder="F.eks. Gruppe 2C"
          className="w-full text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tilgang</p>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4">
        <Toggle
          on={lederMode}
          onToggle={() => toggleLeder(!lederMode)}
          label="Leder-modus"
          description="Aktiver redigering av aktiviteter, fremmøte og status"
        />
      </div>

      {lederMode && (
        <div className="mt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Ditt navn (leder)</p>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
            <input
              type="text"
              value={staffName}
              onChange={e => handleStaffName(e.target.value)}
              placeholder="F.eks. Martine"
              className="w-full text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-300"
            />
          </div>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Lederverktøy</p>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            <Link href="/ansatte" className="flex items-center justify-between px-4 py-4 active:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">Administrer ansatte</p>
                <p className="text-sm text-gray-500 mt-0.5">Legg til, rediger eller fjern ansatte</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
            <Link href="/timeplan" className="flex items-center justify-between px-4 py-4 active:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">Timeplan (leder)</p>
                <p className="text-sm text-gray-500 mt-0.5">Rediger aktiviteter og belastningsnivå</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
            <Link href="/logg" className="flex items-center justify-between px-4 py-4 active:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">Aktivitetslogg</p>
                <p className="text-sm text-gray-500 mt-0.5">Se historikk over registrerte aktiviteter</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

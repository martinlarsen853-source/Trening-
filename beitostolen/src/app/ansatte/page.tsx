'use client';

import { useEffect, useState } from 'react';
import type { StaffMember } from '@/lib/supabase';
import { StaffAvatar } from '@/components/StaffAvatar';
import { StaffModal } from '@/components/StaffModal';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function AnsattePage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<StaffMember | null | 'new'>(null);

  useEffect(() => {
    fetch('/api/staff')
      .then(r => r.json())
      .then(d => { setStaff(d.staff ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function deleteStaff(id: string) {
    await fetch('/api/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setStaff(prev => prev.filter(s => s.id !== id));
  }

  function onSaved(s: StaffMember) {
    setStaff(prev => {
      const idx = prev.findIndex(x => x.id === s.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n; }
      return [...prev, s];
    });
  }

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900">Ansatte</h2>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-600 text-white text-sm font-bold"
        >
          <Plus size={14} />
          Legg til
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-5">Ledere, studenter og fagpersoner</p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-3xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-medium">Ingen ansatte lagt til ennå</p>
          <p className="text-sm mt-1">Trykk «Legg til» for å starte</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <StaffAvatar name={s.name} photoUrl={s.photo_url} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{s.name}</p>
                {s.title && <p className="text-sm text-gray-500">{s.title}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setModal(s)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                  <Pencil size={14} className="text-gray-400" />
                </button>
                <button onClick={() => deleteStaff(s.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <StaffModal
          member={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

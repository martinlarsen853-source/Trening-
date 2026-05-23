'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase, type StaffMember } from '@/lib/supabase';
import { StaffAvatar } from '@/components/StaffAvatar';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

// ─── Edit / Add modal ────────────────────────────────────────────────────────

function StaffModal({
  member,
  onClose,
  onSaved,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSaved: (s: StaffMember) => void;
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [title, setTitle] = useState(member?.title ?? '');
  const [photoUrl, setPhotoUrl] = useState(member?.photo_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(member?.photo_url ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    // Local preview
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('staff-photos').upload(path, file, { upsert: true });
    if (!error) {
      const url = supabase.storage.from('staff-photos').getPublicUrl(path).data.publicUrl;
      setPhotoUrl(url);
    }
    setUploading(false);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), title: title.trim() || null, photo_url: photoUrl || null };

    let result;
    if (member) {
      result = await supabase.from('staff').update(payload).eq('id', member.id).select().single();
    } else {
      result = await supabase.from('staff').insert(payload).select().single();
    }
    setSaving(false);
    if (!result.error && result.data) onSaved(result.data as StaffMember);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl max-w-lg mx-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>

        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-gray-900 text-lg">{member ? 'Rediger ansatt' : 'Legg til ansatt'}</p>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Photo */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {preview
              ? <img src={preview} alt="" className="w-20 h-20 rounded-full object-cover" />
              : <StaffAvatar name={name || '?'} size="xl" />
            }
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-600 font-semibold text-sm disabled:opacity-50"
            >
              {uploading ? 'Laster opp…' : 'Velg bilde'}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG eller PNG, maks 5 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Navn</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Fornavn Etternavn"
            className="mt-1 w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tittel / rolle</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="F.eks. Fysioterapeut, Student, Leder"
            className="mt-1 w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <button
          onClick={save}
          disabled={!name.trim() || saving}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm disabled:opacity-40"
        >
          {saving ? 'Lagrer…' : 'Lagre'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnsattePage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null | 'new'>('new' as const);
  const [modal, setModal] = useState<StaffMember | null | 'new'>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsStaff(user?.user_metadata?.role === 'staff');
    });
    supabase.from('staff').select('*').order('sort_order').order('name')
      .then(({ data }) => { setStaff((data ?? []) as StaffMember[]); setLoading(false); });
  }, []);

  async function deleteStaff(id: string) {
    await supabase.from('staff').delete().eq('id', id);
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
        {isStaff && (
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-600 text-white text-sm font-bold"
          >
            <Plus size={14} />
            Legg til
          </button>
        )}
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
          {isStaff && <p className="text-sm mt-1">Trykk «Legg til» for å starte</p>}
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
              {isStaff && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal(s)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <Pencil size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => deleteStaff(s.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              )}
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

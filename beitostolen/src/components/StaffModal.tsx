'use client';

import { useRef, useState } from 'react';
import type { StaffMember } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { X } from 'lucide-react';

export function StaffModal({
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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(member?.photo_url ?? null);
  // photo stored as base64 + extension to send to server
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoExt, setPhotoExt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      // Resize to max 600x600
      const MAX = 600;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setPreview(dataUrl);
      setPhotoBase64(dataUrl.split(',')[1]);
      setPhotoExt('jpg');
      setUploading(false);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); setUploading(false); };
    img.src = objectUrl;
  }

  async function save() {
    if (!name.trim()) return;
    setError(null);
    setSaving(true);

    const id = member?.id ?? crypto.randomUUID();
    const body = {
      id,
      name: name.trim(),
      title: title.trim() || null,
      photoBase64: photoBase64 ?? undefined,
      photoExt: photoExt ?? undefined,
      existingPhotoUrl: member?.photo_url ?? undefined,
    };

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Ukjent feil — prøv igjen');
        setSaving(false);
        return;
      }
      onSaved(json.staff as StaffMember);
      onClose();
    } catch (err) {
      setError('Nettverksfeil — sjekk tilkoblingen');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1010] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl max-w-lg mx-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>

        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-gray-900 text-lg">{member ? 'Rediger ansatt' : 'Legg til ansatt'}</p>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

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
              {uploading ? 'Leser bilde…' : 'Velg bilde'}
            </button>
            <p className="text-xs text-gray-400 mt-1">Velg et bilde — skaleres automatisk</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Navn</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Fornavn Etternavn"
            className="mt-1 w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tittel / rolle</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="F.eks. Fysioterapeut, Student, Leder"
            className="mt-1 w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5 mb-3">{error}</p>
        )}

        <button
          onClick={save}
          disabled={!name.trim() || saving || uploading}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm disabled:opacity-40"
        >
          {saving ? 'Lagrer…' : 'Lagre'}
        </button>
      </div>
    </div>
  );
}

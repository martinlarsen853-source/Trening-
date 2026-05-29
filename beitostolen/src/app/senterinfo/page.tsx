'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Check, X } from 'lucide-react';

type Section = {
  id: string;
  section_key: string;
  title: string;
  content: string;
  icon: string;
  sort_order: number;
};

export default function SenterinfoPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const isLeder = typeof window !== 'undefined' && localStorage.getItem('lederMode') === 'true';

  useEffect(() => {
    supabase
      .from('center_info')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        setSections((data ?? []) as Section[]);
        setLoading(false);
      });
  }, []);

  function startEdit(s: Section) {
    setEditingId(s.id);
    setEditContent(s.content);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await supabase.from('center_info').update({ content: editContent, updated_at: new Date().toISOString() }).eq('id', id);
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: editContent } : s));
    setSaving(false);
    setEditingId(null);
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-3xl bg-gray-100 animate-pulse mb-3" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-black text-gray-900">Praktisk info</h2>
        <p className="text-sm text-gray-500">Nyttig informasjon om oppholdet</p>
      </div>

      <div className="flex flex-col gap-3">
        {sections.map(s => (
          <div key={s.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <p className="font-bold text-gray-900">{s.title}</p>
              </div>
              {isLeder && editingId !== s.id && (
                <button
                  onClick={() => startEdit(s)}
                  className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
                >
                  <Edit2 size={12} /> Rediger
                </button>
              )}
            </div>

            <div className="px-5 py-4">
              {editingId === s.id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Skriv inn informasjon her…"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm flex items-center justify-center gap-1.5"
                    >
                      <X size={13} /> Avbryt
                    </button>
                    <button
                      onClick={() => saveEdit(s.id)}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Check size={13} /> Lagre
                    </button>
                  </div>
                </>
              ) : s.content ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s.content}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {isLeder ? 'Trykk Rediger for å legge til informasjon' : 'Ikke fylt ut ennå'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

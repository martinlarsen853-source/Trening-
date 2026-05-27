'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Companion } from '@/lib/supabase';
import { Plus, Copy, Check, Trash2, RefreshCw, ChevronRight, X, UserPlus } from 'lucide-react';

type Child = {
  id: string;
  name: string;
  access_password: string | null;
  adaptations: string[];
};

type ChildWithStatus = Child & {
  formLevel: 'grønn' | 'gul' | 'rød' | null;
  absenceCount: number;
  companions: Companion[];
};

const STATUS_COLOR: Record<string, { bg: string; label: string }> = {
  grønn: { bg: 'bg-green-500',  label: 'God form'   },
  gul:   { bg: 'bg-amber-400',  label: 'Middels'    },
  rød:   { bg: 'bg-red-500',    label: 'Lav form'   },
};

function CompanionSheet({
  child,
  isAdmin,
  onClose,
}: {
  child: ChildWithStatus;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [companions, setCompanions] = useState<Companion[]>(child.companions);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const companionId = typeof window !== 'undefined' ? localStorage.getItem('companionId') : null;

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from('companions').select('*').eq('child_id', child.id).order('created_at');
    if (data) setCompanions(data as Companion[]);
  }, [child.id]);

  async function addCompanion() {
    setGenerating(true);
    await supabase.rpc('generate_companion_invite', {
      p_child_id: child.id,
      p_invited_by: companionId ?? null,
    });
    await reload();
    setGenerating(false);
  }

  async function deleteCompanion(id: string) {
    setDeleting(id);
    await supabase.from('companions').delete().eq('id', id);
    await reload();
    setDeleting(null);
  }

  function copyCode(pw: string, id: string) {
    navigator.clipboard.writeText(pw).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const canDelete = (c: Companion) =>
    isAdmin || c.id === companionId || (companions.find(x => x.id === companionId)?.is_primary ?? false);

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-black text-gray-900">{child.name}</p>
            <p className="text-xs text-gray-400">Ledsagere</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="px-5 py-4">
          {companions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Ingen ledsagere registrert</p>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {companions.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">
                        {c.name || <span className="text-gray-400 italic">Ikke logget inn ennå</span>}
                      </p>
                      {c.is_primary && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Hoved
                        </span>
                      )}
                    </div>
                    {c.access_password && (
                      <p className="font-mono text-sm text-blue-700 font-bold tracking-widest mt-0.5">
                        {c.access_password}
                      </p>
                    )}
                    {c.invited_by && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Invitert av {companions.find(x => x.id === c.invited_by)?.name ?? 'ledsager'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {c.access_password && (
                      <button
                        onClick={() => copyCode(c.access_password!, c.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-200 text-gray-500 active:scale-95"
                      >
                        {copied === c.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                      </button>
                    )}
                    {canDelete(c) && (
                      <button
                        onClick={() => deleteCompanion(c.id)}
                        disabled={deleting === c.id}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 active:scale-95 disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(isAdmin || !!companionId) && (
            <button
              onClick={addCompanion}
              disabled={generating}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {generating
                ? <><RefreshCw size={15} className="animate-spin" />Genererer kode…</>
                : <><UserPlus size={15} />Inviter ny ledsager</>}
            </button>
          )}
          {!isAdmin && !!companionId && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Del koden med den nye ledsageren. De setter eget navn ved første innlogging.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChildOverview({ isAdmin }: { isAdmin: boolean }) {
  const [children, setChildren] = useState<ChildWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChildWithStatus | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') ?? '' : '';

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [childRes, checkinRes, absenceRes, companionRes] = await Promise.all([
      supabase.from('children').select('id, name, access_password, adaptations')
        .eq('group_id', groupId).order('name'),
      supabase.from('daily_checkins').select('child_name, form_level').eq('date', today),
      supabase.from('absences').select('child_name')
        .gte('registered_at', today + 'T00:00:00Z')
        .lte('registered_at', today + 'T23:59:59Z'),
      supabase.from('companions').select('*').order('created_at'),
    ]);

    const checkinMap: Record<string, 'grønn' | 'gul' | 'rød'> = {};
    for (const r of (checkinRes.data ?? []) as { child_name: string; form_level: 'grønn' | 'gul' | 'rød' }[]) {
      checkinMap[r.child_name] = r.form_level;
    }

    const absenceMap: Record<string, number> = {};
    for (const r of (absenceRes.data ?? []) as { child_name: string }[]) {
      absenceMap[r.child_name] = (absenceMap[r.child_name] ?? 0) + 1;
    }

    const companionsByChild: Record<string, Companion[]> = {};
    for (const c of (companionRes.data ?? []) as Companion[]) {
      if (!companionsByChild[c.child_id]) companionsByChild[c.child_id] = [];
      companionsByChild[c.child_id].push(c);
    }

    const enriched: ChildWithStatus[] = ((childRes.data ?? []) as Child[]).map(ch => ({
      ...ch,
      formLevel: checkinMap[ch.name] ?? null,
      absenceCount: absenceMap[ch.name] ?? 0,
      companions: companionsByChild[ch.id] ?? [],
    }));

    setChildren(enriched);
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  async function addChild() {
    if (!newName.trim() || !groupId) return;
    setAdding(true);
    await supabase.from('children').insert({ group_id: groupId, name: newName.trim() });
    setNewName('');
    setAdding(false);
    load();
  }

  function copyCode(pw: string, id: string) {
    navigator.clipboard.writeText(pw).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="px-4 pt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">Barneoversikt</h2>
          <p className="text-sm text-gray-500">{children.length} barn</p>
        </div>
        {isAdmin && (
          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Admin</span>
        )}
        {!isAdmin && (
          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Student</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4">
        {Object.entries(STATUS_COLOR).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${val.bg}`} />
            <span className="text-xs text-gray-500">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-500">Ikke registrert</span>
        </div>
      </div>

      {/* Child list */}
      <div className="flex flex-col gap-2 mb-5">
        {children.map(child => {
          const st = child.formLevel ? STATUS_COLOR[child.formLevel] : null;
          return (
            <button
              key={child.id}
              onClick={() => setSelected(child)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 w-full text-left active:scale-[0.99] transition-transform"
            >
              {/* Traffic light */}
              <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${st?.bg ?? 'bg-gray-200'}`} />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{child.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {child.companions.length > 0 && (
                    <span className="text-[11px] text-gray-400">
                      {child.companions.length} ledsager{child.companions.length !== 1 ? 'e' : ''}
                    </span>
                  )}
                  {child.absenceCount > 0 && (
                    <span className="text-[11px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                      {child.absenceCount} avbud
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && child.access_password && (
                  <button
                    onClick={e => { e.stopPropagation(); copyCode(child.access_password!, child.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 active:scale-95"
                    title="Kopier barnekode"
                  >
                    {copied === child.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                )}
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Add child — admin only */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Legg til barn</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChild()}
              placeholder="Fullt navn…"
              className="flex-1 min-w-0 text-sm border border-gray-200 rounded-2xl px-4 py-2.5 outline-none focus:border-blue-400"
            />
            <button
              onClick={addChild}
              disabled={adding || !newName.trim()}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-40 active:scale-95 flex-shrink-0"
            >
              {adding ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Companion sheet */}
      {selected && (
        <CompanionSheet
          child={selected}
          isAdmin={isAdmin}
          onClose={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}

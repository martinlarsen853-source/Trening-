'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type Companion } from '@/lib/supabase';
import { ALL_ADAPTATIONS } from '@/components/ChildAdaptations';
import {
  ArrowLeft, RefreshCw, Copy, Check, Trash2, UserPlus,
  Star, Edit2, X, ChevronDown, ChevronUp,
} from 'lucide-react';

type Child = {
  id: string; name: string; group_id: string;
  adaptations: string[]; note: string | null; access_password: string | null;
};

type FormLevel = 'grønn' | 'gul' | 'rød';
type Log = {
  id: string; date: string; how_went: 'bra' | 'ok' | 'vanskelig';
  load_after: string | null; notes: string | null; logged_by: string; activity_name?: string;
};

const DOT: Record<string, string> = { grønn: 'bg-green-500', gul: 'bg-amber-400', rød: 'bg-red-500' };
const FORM_LABEL: Record<FormLevel, string> = { grønn: 'God form', gul: 'Middels', rød: 'Lav form' };
const COLOR_MAP = Object.fromEntries(ALL_ADAPTATIONS.map(a => [a.key, a.color]));
const LABEL_MAP = Object.fromEntries(ALL_ADAPTATIONS.map(a => [a.key, a.label]));

/* ──────────────────────────────── Companion section ──────────────────────────── */

function CompanionSection({ childId, isAdmin }: { childId: string; isAdmin: boolean }) {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const myCompanionId = typeof window !== 'undefined' ? localStorage.getItem('companionId') : null;

  const reload = useCallback(async () => {
    const { data } = await supabase.from('companions').select('*').eq('child_id', childId).order('created_at');
    setCompanions((data ?? []) as Companion[]);
    setLoading(false);
  }, [childId]);

  useEffect(() => { reload(); }, [reload]);

  async function addCompanion() {
    setGenerating(true);
    try {
      await supabase.rpc('generate_companion_invite', {
        p_child_id: childId,
        p_invited_by: myCompanionId ?? null,
      });
      await reload();
    } catch { /* ignore */ }
    setGenerating(false);
  }

  async function deactivate(id: string) {
    await supabase.rpc('deactivate_companion', { p_companion_id: id });
    await reload();
  }

  async function setPrimary(id: string) {
    await supabase.rpc('set_primary_companion', { p_companion_id: id, p_child_id: childId });
    await reload();
  }

  function copyCode(pw: string, id: string) {
    navigator.clipboard.writeText(pw).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const canDeactivate = (c: Companion) =>
    isAdmin || c.id === myCompanionId ||
    companions.find(x => x.id === myCompanionId)?.is_primary === true;

  const activeCompanions = companions.filter(c => c.is_active);

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-4">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
        aria-expanded={expanded}
      >
        <div>
          <p className="font-bold text-gray-900 text-left">Ledsagere</p>
          <p className="text-xs text-gray-400">{activeCompanions.length} registrert</p>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {loading ? (
            <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
          ) : activeCompanions.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Ingen ledsagere registrert</p>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {activeCompanions.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">
                        {c.name || <span className="text-gray-400 italic text-xs">Ikke logget inn</span>}
                      </p>
                      {c.is_primary && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star size={9} fill="currentColor" /> Hoved
                        </span>
                      )}
                    </div>
                    {c.access_password && (
                      <p className="font-mono text-sm text-blue-700 font-bold tracking-widest mt-0.5">{c.access_password}</p>
                    )}
                    {c.invited_by && (
                      <p className="text-[11px] text-gray-400">
                        Invitert av {companions.find(x => x.id === c.invited_by)?.name || 'ledsager'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {c.access_password && (
                      <button
                        onClick={() => copyCode(c.access_password!, c.id)}
                        aria-label="Kopier kode"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-200 text-gray-500 active:scale-95"
                      >
                        {copied === c.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    )}
                    {isAdmin && !c.is_primary && (
                      <button
                        onClick={() => setPrimary(c.id)}
                        aria-label="Sett som hovedledsager"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500 active:scale-95"
                        title="Sett som hoved"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    {canDeactivate(c) && (
                      <button
                        onClick={() => deactivate(c.id)}
                        aria-label={`Deaktiver ${c.name || 'ledsager'}`}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 active:scale-95"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(isAdmin || !!myCompanionId) && (
            <button
              onClick={addCompanion}
              disabled={generating}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {generating
                ? <><RefreshCw size={14} className="animate-spin" />Genererer…</>
                : <><UserPlus size={14} />Inviter ny ledsager</>}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ──────────────────────────────── Adaptations edit ──────────────────────────── */

function AdaptationsSection({ child, isAdmin, onUpdated }: {
  child: Child; isAdmin: boolean; onUpdated: (adaptations: string[], note: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(child.adaptations));
  const [note, setNote] = useState(child.note ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('children').update({ adaptations: [...selected], note: note.trim() || null }).eq('id', child.id);
    setSaving(false);
    onUpdated([...selected], note.trim() || null);
    setEditing(false);
  }

  const tags = child.adaptations;

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-4">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="font-bold text-gray-900">Tilpasninger</p>
        {isAdmin && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Rediger tilpasninger"
            className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold"
          >
            <Edit2 size={13} /> Rediger
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen tilpasninger registrert</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(key => (
              <span key={key} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${COLOR_MAP[key] ?? 'bg-gray-100 text-gray-600'}`}>
                {LABEL_MAP[key] ?? key}
              </span>
            ))}
          </div>
        )}
        {child.note && (
          <p className="text-sm text-gray-500 italic mt-2">{child.note}</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-end" onClick={() => setEditing(false)}>
          <div className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-black text-gray-900">Tilpasninger — {child.name}</p>
              <button onClick={() => setEditing(false)} aria-label="Lukk"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-2">
              {ALL_ADAPTATIONS.map(a => {
                const on = selected.has(a.key);
                return (
                  <button key={a.key} onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(a.key)) n.delete(a.key); else n.add(a.key); return n; })}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 transition-all text-left ${on ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <span className={`text-sm font-semibold ${on ? 'text-blue-700' : 'text-gray-600'}`}>{a.label}</span>
                    {on && <Check size={14} className="text-blue-600" />}
                  </button>
                );
              })}
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notat</p>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="F.eks. trenger 10 min hvile mellom basseng og gymsal"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>
            <div className="px-5 pb-6">
              <button onClick={save} disabled={saving}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40">
                {saving ? 'Lagrer…' : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ──────────────────────────────── Activity log ──────────────────────────────── */

function ActivityLogSection({ childId }: { childId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('activity_logs')
      .select('id, date, how_went, load_after, notes, logged_by')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { setLogs((data ?? []) as Log[]); setLoading(false); });
  }, [childId]);

  const HOW: Record<string, string> = { bra: '😊 Bra', ok: '😐 Ok', vanskelig: '😔 Vanskelig' };
  const LOAD: Record<string, string> = { lav: '🟢 Lav', middels: '🟡 Middels', høy: '🔴 Høy' };

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-4">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="font-bold text-gray-900">Aktivitetslogg</p>
        <p className="text-xs text-gray-400">Siste registreringer</p>
      </div>
      <div className="px-5 py-3">
        {loading ? (
          <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Ingen logg for dette barnet ennå</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map(l => (
              <div key={l.id} className="bg-gray-50 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400">{l.date}</p>
                  <span className="text-xs text-gray-400">{l.logged_by}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 font-medium">
                    {HOW[l.how_went] ?? l.how_went}
                  </span>
                  {l.load_after && (
                    <span className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 font-medium">
                      {LOAD[l.load_after] ?? l.load_after}
                    </span>
                  )}
                </div>
                {l.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{l.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────────── Main page ──────────────────────────────────── */

export default function ChildProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const childId = params.id;

  const [child, setChild] = useState<Child | null>(null);
  const [formLevel, setFormLevel] = useState<FormLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(
      localStorage.getItem('lederMode') === 'true' ||
      localStorage.getItem('staffRole') === 'admin'
    );
  }, []);

  useEffect(() => {
    const today = new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10);
    Promise.all([
      supabase.from('children').select('*').eq('id', childId).single(),
      supabase.from('daily_checkins').select('form_level').eq('child_id', childId).eq('date', today).maybeSingle(),
    ]).then(([childRes, checkinRes]) => {
      if (childRes.error || !childRes.data) { setError('Barn ikke funnet'); setLoading(false); return; }
      setChild(childRes.data as Child);
      if (checkinRes.data) setFormLevel((checkinRes.data as { form_level: FormLevel }).form_level);
      setLoading(false);
    }).catch(() => { setError('Kunne ikke nå senteret. Prøv igjen.'); setLoading(false); });
  }, [childId]);

  if (loading) {
    return (
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <div className="h-8 w-40 bg-gray-100 rounded-xl animate-pulse mb-4" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-3xl bg-gray-100 animate-pulse mb-3" />)}
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="px-4 pt-4 max-w-lg mx-auto text-center py-16">
        <p className="text-gray-400">{error || 'Ikke funnet'}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 font-semibold">Tilbake</button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        aria-label="Tilbake"
        className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold mb-5"
      >
        <ArrowLeft size={16} /> Tilbake
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <span className={`w-5 h-5 rounded-full flex-shrink-0 ${DOT[formLevel ?? ''] ?? 'bg-gray-200'}`} aria-hidden />
        <div>
          <h2 className="text-2xl font-black text-gray-900">{child.name}</h2>
          {formLevel && (
            <p className="text-sm text-gray-500">{FORM_LABEL[formLevel]}</p>
          )}
        </div>
      </div>

      {/* Adaptations */}
      <AdaptationsSection
        child={child}
        isAdmin={isAdmin}
        onUpdated={(adaptations, note) => setChild(prev => prev ? { ...prev, adaptations, note } : prev)}
      />

      {/* Companions */}
      <CompanionSection childId={childId} isAdmin={isAdmin} />

      {/* Activity log */}
      <ActivityLogSection childId={childId} />
    </div>
  );
}

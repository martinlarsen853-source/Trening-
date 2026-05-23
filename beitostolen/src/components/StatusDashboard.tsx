'use client';

import { useState, useEffect } from 'react';
import { supabase, type Activity, type ActivityStatus, type StaffMember } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { DagsformWidget } from './DagsformWidget';
import { MapPin, Clock, ChevronRight, Box } from 'lucide-react';
import { BygningKart, gpsToSvg } from './BygningKart';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

// ─── Time helpers (CEST = UTC+2) ───────────────────────────────────────────

function cestDate() {
  return new Date(Date.now() + 2 * 3_600_000);
}
function nowHHMM() {
  const d = cestDate();
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
function nowMins() {
  const [h, m] = nowHHMM().split(':').map(Number);
  return h * 60 + m;
}
function toMins(t: string) {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}
function todayDayOfWeek() {
  const d = cestDate().getUTCDay();
  return d === 0 ? 7 : d;
}
function currentWeekStart() {
  const d = cestDate();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
function formatUntil(timeStr: string) {
  const diff = toMins(timeStr) - nowMins();
  if (diff <= 0) return null;
  if (diff < 60) return `om ${diff} min`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return m > 0 ? `om ${h}t ${m}min` : `om ${h}t`;
}
function formatRemaining(timeStr: string) {
  const diff = toMins(timeStr) - nowMins();
  if (diff <= 0) return null;
  if (diff < 60) return `Slutter om ${diff} min`;
  return `Slutter om ${Math.floor(diff / 60)}t ${diff % 60}min`;
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

const LOAD = {
  lav:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Lav'     },
  middels: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400',  label: 'Middels' },
  høy:     { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Høy'     },
} as const;

function initials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const TOUR_URL = 'https://bhss.adfectus.io/bundle/showcase.html?m=yPcBVhF91Z7&play=1&qs=1&log=0';

// ─── Live-status helpers ─────────────────────────────────────────────────────

const STATUS_META = {
  pågår:     { label: 'Pågår',     bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  forsinket: { label: 'Forsinket', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  avlyst:    { label: 'Avlyst',    bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  flyttet:   { label: 'Flyttet',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
} as const;

function StatusBadge({ status, note }: { status: ActivityStatus['status']; note: string | null }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}{note ? ` · ${note}` : ''}
    </span>
  );
}

function StatusPicker({
  activityId, current, note, staffName, date, onSave, onClose,
}: {
  activityId: string; current: ActivityStatus['status'] | null; note: string | null;
  staffName: string; date: string; onSave: (s: ActivityStatus) => void; onClose: () => void;
}) {
  const [picked, setPicked] = useState<ActivityStatus['status'] | null>(current);
  const [noteVal, setNoteVal] = useState(note ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!picked) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('activity_status')
      .upsert(
        { activity_id: activityId, date, status: picked, note: noteVal || null, updated_by: staffName, updated_at: new Date().toISOString() },
        { onConflict: 'activity_id,date' }
      )
      .select()
      .single();
    setSaving(false);
    if (!error && data) onSave(data as ActivityStatus);
    onClose();
  }

  async function clear() {
    await supabase.from('activity_status').delete().match({ activity_id: activityId, date });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl max-w-lg mx-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <p className="font-bold text-gray-900 mb-3">Sett status</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['forsinket', 'avlyst', 'flyttet'] as const).map(s => {
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => setPicked(s)}
                className={`py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                  picked === s ? `${m.bg} ${m.text} border-current` : 'bg-gray-50 text-gray-500 border-transparent'
                }`}>
                {m.label}
              </button>
            );
          })}
        </div>
        {(picked === 'forsinket' || picked === 'flyttet') && (
          <input
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-4 outline-none focus:border-blue-400"
            placeholder={picked === 'forsinket' ? 'F.eks. starter kl 11:45' : 'F.eks. flyttet til Gymsal'}
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
          />
        )}
        <div className="flex gap-2">
          {current && (
            <button onClick={clear} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm">
              Fjern status
            </button>
          )}
          <button onClick={save} disabled={!picked || saving}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm disabled:opacity-40">
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Map modal ───────────────────────────────────────────────────────────────

function MapModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const [show3d, setShow3d] = useState(false);
  const [ledsagerPos, setLedsagerPos] = useState<{ x: number; y: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'ok' | 'denied' | 'unsupported'>('loading');

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('unsupported'); return; }
    const id = navigator.geolocation.watchPosition(
      pos => {
        setLedsagerPos(gpsToSvg(pos.coords.latitude, pos.coords.longitude));
        setGpsStatus('ok');
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500 flex-shrink-0" />
            <span className="font-bold text-gray-900">{activity.location ?? activity.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>

        {show3d ? (
          /* 3D-omvisning */
          <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ height: '55vh' }}>
            <iframe
              src={TOUR_URL}
              className="w-full h-full border-0"
              allowFullScreen
              allow="xr-spatial-tracking"
              title="3D-omvisning BHS"
            />
          </div>
        ) : (
          /* Oversiktskart */
          <div className="px-4 pb-4">
            <div className="bg-blue-50 rounded-2xl p-3 mb-2">
              <BygningKart location={activity.location} ledsagerPos={ledsagerPos} />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {gpsStatus === 'loading' && (
                <><div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" /><span className="text-xs text-gray-400">Henter posisjon…</span></>
              )}
              {gpsStatus === 'ok' && (
                <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-green-600">Posisjon oppdatert · unøyaktig innendørs</span></>
              )}
              {gpsStatus === 'denied' && (
                <span className="text-xs text-gray-400">GPS ikke tilgjengelig</span>
              )}
              {gpsStatus === 'unsupported' && (
                <span className="text-xs text-gray-400">Skjematisk oversikt — ikke i målestokk</span>
              )}
            </div>
            <button
              onClick={() => setShow3d(true)}
              className="w-full rounded-2xl bg-blue-600 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Box size={16} />
              Se 3D-omvisning av bygget
            </button>
          </div>
        )}

        {show3d && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShow3d(false)}
              className="w-full rounded-2xl bg-gray-100 text-gray-600 font-semibold py-2.5 text-sm active:scale-95 transition-all"
            >
              ← Tilbake til kart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Current activity (large hero card) ─────────────────────────────────────

function NowCard({ activity, liveStatus, staffMember, onMap, onEditStatus }: {
  activity: Activity; liveStatus: ActivityStatus | null;
  staffMember: StaffMember | null;
  onMap: () => void; onEditStatus?: () => void;
}) {
  const remaining = formatRemaining(activity.time_end);
  const load = activity.load_level ? LOAD[activity.load_level] : null;
  const isAvlyst = liveStatus?.status === 'avlyst';
  const displayName = staffMember?.name ?? activity.staff_name;

  return (
    <div className={`rounded-3xl p-5 shadow-lg ${isAvlyst ? 'bg-gray-200' : 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-500/25'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold tracking-wide ${isAvlyst ? 'text-gray-500' : 'text-blue-200'}`}>
          {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
          {remaining && !isAvlyst && <span className={`font-normal text-blue-300`}> · {remaining}</span>}
        </span>
        <div className="flex items-center gap-2">
          {liveStatus
            ? <StatusBadge status={liveStatus.status} note={liveStatus.note} />
            : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Pågår
              </span>
          }
          {load && !liveStatus && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${load.bg} ${load.text}`}>{load.label}</span>
          )}
          {onEditStatus && (
            <button onClick={onEditStatus} className="text-white/60 hover:text-white text-lg leading-none w-6 h-6 flex items-center justify-center">⋯</button>
          )}
        </div>
      </div>

      <h3 className={`text-[1.75rem] font-black tracking-tight leading-none mb-4 ${isAvlyst ? 'text-gray-400 line-through' : 'text-white'}`}>
        {activity.name}
      </h3>

      {!isAvlyst && (
        <div className="flex flex-col gap-2">
          {displayName && (
            <div className="flex items-center gap-2.5">
              <StaffAvatar name={displayName} photoUrl={staffMember?.photo_url} size="sm" />
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
                {staffMember?.title && <p className="text-xs text-blue-200">{staffMember.title}</p>}
              </div>
            </div>
          )}
          {activity.location && (
            <button onClick={onMap} className="flex items-center gap-1.5 text-left w-fit">
              <MapPin size={13} className="text-blue-300 flex-shrink-0" />
              <span className="text-sm text-blue-200 underline underline-offset-2 decoration-blue-400/60">{activity.location}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Upcoming activity (smaller card) ───────────────────────────────────────

function UpcomingCard({ activity, label, liveStatus, staffMember, onMap, onEditStatus }: {
  activity: Activity; label: string; liveStatus: ActivityStatus | null;
  staffMember: StaffMember | null;
  onMap: () => void; onEditStatus?: () => void;
}) {
  const until = formatUntil(activity.time_start);
  const load = activity.load_level ? LOAD[activity.load_level] : null;
  const isAvlyst = liveStatus?.status === 'avlyst';
  const displayName = staffMember?.name ?? activity.staff_name;

  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">{label}</p>
      <div className={`rounded-3xl border px-4 py-3.5 shadow-sm flex items-center gap-3 ${isAvlyst ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}>
        {displayName && <StaffAvatar name={displayName} photoUrl={staffMember?.photo_url} size="md" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs text-gray-400 tabular-nums">{activity.time_start.slice(0, 5)}</span>
            {until && !isAvlyst && <span className="text-xs text-blue-500 font-semibold">{until}</span>}
            {liveStatus
              ? <StatusBadge status={liveStatus.status} note={liveStatus.note} />
              : load && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${load.bg} ${load.text}`}>{load.label}</span>
            }
          </div>
          <p className={`font-bold truncate ${isAvlyst ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{activity.name}</p>
          {!isAvlyst && (
            <div className="flex items-center gap-3 mt-0.5">
              {displayName && (
                <span className="text-xs text-gray-400">{staffMember?.title ?? displayName.split(' ')[0]}</span>
              )}
              {activity.location && (
                <button onClick={onMap} className="text-xs text-blue-500 flex items-center gap-0.5">
                  <MapPin size={10} className="flex-shrink-0" />
                  {activity.location}
                </button>
              )}
            </div>
          )}
        </div>
        {onEditStatus
          ? <button onClick={onEditStatus} className="text-gray-300 hover:text-gray-500 text-lg w-6 h-6 flex items-center justify-center flex-shrink-0">⋯</button>
          : <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        }
      </div>
    </div>
  );
}

// ─── Rest of day ─────────────────────────────────────────────────────────────

function RestOfDay({ activities, statuses }: { activities: Activity[]; statuses: Record<string, ActivityStatus> }) {
  if (activities.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Resten av dagen</p>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {activities.map(a => {
          const load = a.load_level ? LOAD[a.load_level] : null;
          const ls = statuses[a.id];
          const isAvlyst = ls?.status === 'avlyst';
          return (
            <div key={a.id} className={`flex items-center gap-3 px-4 py-2.5 ${isAvlyst ? 'opacity-50' : ''}`}>
              <span className="text-xs text-gray-400 tabular-nums w-10 flex-shrink-0">{a.time_start.slice(0, 5)}</span>
              <span className={`text-sm font-medium flex-1 truncate ${isAvlyst ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{a.name}</span>
              {ls
                ? <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_META[ls.status].dot}`} />
                : load && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${load.dot}`} />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StatusDashboard() {
  const [childName, setChildName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [viewMode, setViewMode] = useState<'leder' | 'ledsager'>('ledsager');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({});
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember>>({});
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [mapActivity, setMapActivity] = useState<Activity | null>(null);
  const [editStatusActivity, setEditStatusActivity] = useState<Activity | null>(null);

  // Fetch staff lookup
  useEffect(() => {
    supabase.from('staff').select('*').then(({ data }) => {
      if (data) {
        const m: Record<string, StaffMember> = {};
        for (const s of data) m[s.id] = s as StaffMember;
        setStaffMap(m);
      }
    });
  }, []);

  // Refresh time display every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = user?.user_metadata?.role;
      const staff = role === 'staff';
      setIsStaff(staff);
      if (staff) {
        setViewMode('leder');
        setStaffName(user?.user_metadata?.full_name ?? 'Leder');
      }
      const name = user?.user_metadata?.full_name as string | undefined;
      if (name) { setChildName(name); } else {
        const stored = localStorage.getItem('childName');
        if (stored) setChildName(stored);
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!childName) return;
    const today = new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10);

    fetch(`/api/activities?week=${currentWeekStart()}`)
      .then(r => r.json())
      .then(async d => {
        const dayOfWeek = todayDayOfWeek();
        const all: Activity[] = [...(d.activities ?? []), ...(d.fritidActivities ?? [])];
        const todayActs = all
          .filter(a => a.day_of_week === dayOfWeek)
          .filter(a => !a.target_child || a.target_child.toLowerCase() === (childName ?? '').toLowerCase())
          .sort((a, b) => a.time_start.localeCompare(b.time_start));
        setActivities(todayActs);

        // Fetch live statuses for today's activities
        if (todayActs.length > 0) {
          const ids = todayActs.map(a => a.id);
          const { data } = await supabase
            .from('activity_status')
            .select('*')
            .in('activity_id', ids)
            .eq('date', today);
          if (data) {
            const map: Record<string, ActivityStatus> = {};
            for (const s of data) map[s.activity_id] = s as ActivityStatus;
            setStatuses(map);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [childName]);

  // Realtime subscription for status updates
  useEffect(() => {
    const today = new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10);
    const channel = supabase
      .channel('activity_status_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_status', filter: `date=eq.${today}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            setStatuses(prev => { const n = { ...prev }; delete n[(payload.old as ActivityStatus).activity_id]; return n; });
          } else {
            const s = payload.new as ActivityStatus;
            setStatuses(prev => ({ ...prev, [s.activity_id]: s }));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (authLoading) return (
    <div className="flex items-center justify-center pt-20">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
  if (!childName) return null;

  const mins = nowMins();
  const current = activities.find(a => toMins(a.time_start) <= mins && toMins(a.time_end) >= mins) ?? null;
  const upcoming = activities.filter(a => toMins(a.time_start) > mins);
  const [next, afterNext, ...rest] = upcoming;

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Hei, {childName.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 capitalize">
            {format(cestDate(), 'EEEE d. MMMM', { locale: nb })}
          </p>
        </div>
        {isStaff && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-gray-400">
              {viewMode === 'leder' ? 'Leder' : 'Ledsager'}
            </span>
            <button
              onClick={() => setViewMode(m => m === 'leder' ? 'ledsager' : 'leder')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                viewMode === 'leder' ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-label="Bytt visningsmodus"
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                viewMode === 'leder' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        )}
      </div>

      {/* Dagsform */}
      <DagsformWidget childName={childName} isLeder={isStaff && viewMode === 'leder'} />

      {/* Nå */}
      <div className="mt-4">
        {loading ? (
          <div className="rounded-3xl bg-blue-100 h-40 animate-pulse" />
        ) : current ? (
          <>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Nå</p>
            <NowCard
              activity={current}
              liveStatus={statuses[current.id] ?? null}
              staffMember={current.staff_id ? (staffMap[current.staff_id] ?? null) : null}
              onMap={() => setMapActivity(current)}
              onEditStatus={isStaff && viewMode === 'leder' ? () => setEditStatusActivity(current) : undefined}
            />
          </>
        ) : upcoming.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100">
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-bold text-gray-700">Ferdig for dagen!</p>
            <p className="text-sm text-gray-400 mt-1">Ingen flere aktiviteter i dag</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-5 text-center border border-gray-100">
            <Clock size={22} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Ingen aktivitet akkurat nå</p>
          </div>
        )}
      </div>

      {/* Neste / Etterpå */}
      {!loading && next && (
        <div className="mt-3">
          <UpcomingCard
            activity={next} label="Neste"
            liveStatus={statuses[next.id] ?? null}
            staffMember={next.staff_id ? (staffMap[next.staff_id] ?? null) : null}
            onMap={() => setMapActivity(next)}
            onEditStatus={isStaff && viewMode === 'leder' ? () => setEditStatusActivity(next) : undefined}
          />
        </div>
      )}
      {!loading && afterNext && (
        <div className="mt-3">
          <UpcomingCard
            activity={afterNext} label="Etterpå"
            liveStatus={statuses[afterNext.id] ?? null}
            staffMember={afterNext.staff_id ? (staffMap[afterNext.staff_id] ?? null) : null}
            onMap={() => setMapActivity(afterNext)}
            onEditStatus={isStaff && viewMode === 'leder' ? () => setEditStatusActivity(afterNext) : undefined}
          />
        </div>
      )}

      {/* Resten av dagen */}
      {!loading && <RestOfDay activities={rest} statuses={statuses} />}

      {/* Kartkort */}
      {mapActivity && <MapModal activity={mapActivity} onClose={() => setMapActivity(null)} />}

      {/* Status-editor (leder) */}
      {editStatusActivity && (
        <StatusPicker
          activityId={editStatusActivity.id}
          current={statuses[editStatusActivity.id]?.status ?? null}
          note={statuses[editStatusActivity.id]?.note ?? null}
          staffName={staffName}
          date={new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10)}
          onSave={s => setStatuses(prev => ({ ...prev, [s.activity_id]: s }))}
          onClose={() => setEditStatusActivity(null)}
        />
      )}
    </div>
  );
}

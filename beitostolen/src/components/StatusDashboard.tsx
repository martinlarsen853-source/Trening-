'use client';

import { useState, useEffect } from 'react';
import { supabase, type Activity } from '@/lib/supabase';
import { DagsformWidget } from './DagsformWidget';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
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

// ─── Map modal ───────────────────────────────────────────────────────────────

function MapModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 max-w-lg mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900">{activity.location ?? activity.name}</h3>
        </div>
        {/* Kart-bilde — legg inn /kart.jpg i public/ for å vise kartet */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center mb-5">
          <img
            src="/kart.jpg"
            alt="Kart over BHS"
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <MapPin size={36} className="text-blue-300 mb-2 relative z-10" />
          <p className="text-base font-bold text-blue-700 relative z-10">{activity.location ?? 'Sted ikke angitt'}</p>
          <p className="text-xs text-blue-400 mt-1 relative z-10">Kart over BHS-senteret legges til her</p>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gray-100 text-gray-700 font-semibold py-3 text-sm active:scale-95 transition-all"
        >
          Lukk
        </button>
      </div>
    </div>
  );
}

// ─── Current activity (large hero card) ─────────────────────────────────────

function NowCard({ activity, onMap }: { activity: Activity; onMap: () => void }) {
  const remaining = formatRemaining(activity.time_end);
  const load = activity.load_level ? LOAD[activity.load_level] : null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-5 shadow-lg shadow-blue-500/25">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-blue-200 tracking-wide">
          {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
          {remaining && <span className="text-blue-300 font-normal"> · {remaining}</span>}
        </span>
        {load && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${load.bg} ${load.text}`}>
            {load.label}
          </span>
        )}
      </div>

      <h3 className="text-[1.75rem] font-black text-white tracking-tight leading-none mb-4">
        {activity.name}
      </h3>

      <div className="flex flex-col gap-2">
        {activity.staff_name && (
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {initials(activity.staff_name)}
            </span>
            <span className="text-sm text-blue-100">{activity.staff_name}</span>
          </div>
        )}
        {activity.location && (
          <button onClick={onMap} className="flex items-center gap-1.5 text-left w-fit">
            <MapPin size={13} className="text-blue-300 flex-shrink-0" />
            <span className="text-sm text-blue-200 underline underline-offset-2 decoration-blue-400/60">
              {activity.location}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming activity (smaller card) ───────────────────────────────────────

function UpcomingCard({ activity, label, onMap }: { activity: Activity; label: string; onMap: () => void }) {
  const until = formatUntil(activity.time_start);
  const load = activity.load_level ? LOAD[activity.load_level] : null;

  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">{label}</p>
      <div className="bg-white rounded-3xl border border-gray-100 px-4 py-3.5 shadow-sm flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs text-gray-400 tabular-nums">{activity.time_start.slice(0, 5)}</span>
            {until && <span className="text-xs text-blue-500 font-semibold">{until}</span>}
            {load && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${load.bg} ${load.text}`}>
                {load.label}
              </span>
            )}
          </div>
          <p className="font-bold text-gray-900 truncate">{activity.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {activity.staff_name && (
              <span className="text-xs text-gray-400">{activity.staff_name.split(' ')[0]}</span>
            )}
            {activity.location && (
              <button onClick={onMap} className="text-xs text-blue-500 flex items-center gap-0.5">
                <MapPin size={10} className="flex-shrink-0" />
                {activity.location}
              </button>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </div>
    </div>
  );
}

// ─── Rest of day ─────────────────────────────────────────────────────────────

function RestOfDay({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Resten av dagen</p>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {activities.map(a => {
          const load = a.load_level ? LOAD[a.load_level] : null;
          return (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs text-gray-400 tabular-nums w-10 flex-shrink-0">{a.time_start.slice(0, 5)}</span>
              <span className="text-sm font-medium text-gray-700 flex-1 truncate">{a.name}</span>
              {load && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${load.dot}`} />}
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
  const [isStaff, setIsStaff] = useState(false);
  const [viewMode, setViewMode] = useState<'leder' | 'ledsager'>('ledsager');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [mapActivity, setMapActivity] = useState<Activity | null>(null);

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
      if (staff) setViewMode('leder');
      const name = user?.user_metadata?.full_name as string | undefined;
      if (name) { setChildName(name); return; }
      const stored = localStorage.getItem('childName');
      if (stored) setChildName(stored);
    });
  }, []);

  useEffect(() => {
    if (!childName) return;
    fetch(`/api/activities?week=${currentWeekStart()}`)
      .then(r => r.json())
      .then(d => {
        const dayOfWeek = todayDayOfWeek();
        const all: Activity[] = [...(d.activities ?? []), ...(d.fritidActivities ?? [])];
        const today = all
          .filter(a => a.day_of_week === dayOfWeek)
          .filter(a => !a.target_child || a.target_child.toLowerCase() === childName.toLowerCase())
          .sort((a, b) => a.time_start.localeCompare(b.time_start));
        setActivities(today);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [childName]);

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
            <NowCard activity={current} onMap={() => setMapActivity(current)} />
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
          <UpcomingCard activity={next} label="Neste" onMap={() => setMapActivity(next)} />
        </div>
      )}
      {!loading && afterNext && (
        <div className="mt-3">
          <UpcomingCard activity={afterNext} label="Etterpå" onMap={() => setMapActivity(afterNext)} />
        </div>
      )}

      {/* Resten av dagen */}
      {!loading && <RestOfDay activities={rest} />}

      {/* Kartkort */}
      {mapActivity && <MapModal activity={mapActivity} onClose={() => setMapActivity(null)} />}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, type Activity, type ActivityStatus, type StaffMember, type RoomCheckin, type ChildProfile } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { ActivityEditModal } from './ActivityEditModal';
import { AttendanceModal } from './AttendanceModal';
import { BygningKart, gpsToSvg } from './BygningKart';
import { MapPin, MessageCircle, Users, Clock, Box, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { DagsformWidget } from './DagsformWidget';

// ─── Time helpers (CEST = UTC+2) ─────────────────────────────────────────────

function cestDate() { return new Date(Date.now() + 2 * 3_600_000); }
function nowHHMM() {
  const d = cestDate();
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
function nowMins() { const [h, m] = nowHHMM().split(':').map(Number); return h * 60 + m; }
function toMins(t: string) { const [h, m] = t.slice(0, 5).split(':').map(Number); return h * 60 + m; }
function todayDayOfWeek() { const d = cestDate().getUTCDay(); return d === 0 ? 7 : d; }
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

const LOAD = {
  lav:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Lav belastning'     },
  middels: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Middels belastning' },
  høy:     { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Høy belastning'     },
} as const;

const STATUS_META = {
  pågår:     { label: 'Pågår',     bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  forsinket: { label: 'Forsinket', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  avlyst:    { label: 'Avlyst',    bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  flyttet:   { label: 'Flyttet',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
} as const;

const TOUR_URL = 'https://bhss.adfectus.io/bundle/showcase.html?m=yPcBVhF91Z7&play=1&qs=1&log=0';

// ─── StatusPicker (leder only) ────────────────────────────────────────────────

function StatusPicker({ activityId, current, note, staffName, date, onSave, onClose }: {
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
      .select().single();
    setSaving(false);
    if (!error && data) onSave(data as ActivityStatus);
    onClose();
  }
  async function clear() {
    await supabase.from('activity_status').delete().match({ activity_id: activityId, date });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
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
                }`}>{m.label}</button>
            );
          })}
        </div>
        {(picked === 'forsinket' || picked === 'flyttet') && (
          <input
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-4 outline-none focus:border-blue-400"
            placeholder={picked === 'forsinket' ? 'F.eks. starter kl 11:45' : 'F.eks. flyttet til Gymsal'}
            value={noteVal} onChange={e => setNoteVal(e.target.value)}
          />
        )}
        <div className="flex gap-2">
          {current && (
            <button onClick={clear} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm">Fjern status</button>
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

// ─── Activity detail modal ────────────────────────────────────────────────────

function ActivityDetailModal({ activity, liveStatus, staffMember, children, isLeder, staffName, date, onStatusSave, onEdit, onAttendance, onClose }: {
  activity: Activity;
  liveStatus: ActivityStatus | null;
  staffMember: StaffMember | null;
  children: ChildProfile[];
  isLeder: boolean;
  staffName: string;
  date: string;
  onStatusSave: (s: ActivityStatus) => void;
  onEdit?: () => void;
  onAttendance?: () => void;
  onClose: () => void;
}) {
  const [show3d, setShow3d] = useState(false);
  const [ledsagerPos, setLedsagerPos] = useState<{ x: number; y: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'ok' | 'denied' | 'unsupported'>('loading');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('unsupported'); return; }
    const id = navigator.geolocation.watchPosition(
      pos => { setLedsagerPos(gpsToSvg(pos.coords.latitude, pos.coords.longitude)); setGpsStatus('ok'); },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const isAvlyst = liveStatus?.status === 'avlyst';
  const isCurrent = toMins(activity.time_start) <= nowMins() && toMins(activity.time_end) >= nowMins();
  const displayName = staffMember?.name ?? activity.staff_name;
  const load = activity.load_level ? LOAD[activity.load_level] : null;
  const statusMeta = liveStatus ? STATUS_META[liveStatus.status] : null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {statusMeta ? (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />{statusMeta.label}
                    {liveStatus?.note && <span className="font-normal"> · {liveStatus.note}</span>}
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Pågår nå
                  </span>
                ) : null}
              </div>
              <h2 className={`text-2xl font-black ${isAvlyst ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {activity.name}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
                {isCurrent && !isAvlyst && (() => { const r = formatRemaining(activity.time_end); return r ? ` · ${r}` : ''; })()}
                {!isCurrent && !isAvlyst && (() => { const u = formatUntil(activity.time_start); return u ? ` · Starter ${u}` : ''; })()}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0">×</button>
          </div>

          {/* Load + location */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activity.location && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <MapPin size={12} className="text-blue-500" />{activity.location}
              </span>
            )}
            {load && (
              <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${load.bg} ${load.text}`}>
                {load.label}
              </span>
            )}
          </div>

          {/* Staff */}
          {displayName && (
            <div className="flex items-center gap-3 mb-5 bg-gray-50 rounded-2xl px-4 py-3">
              <StaffAvatar name={displayName} photoUrl={staffMember?.photo_url ?? null} size="sm" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Ansvarlig</p>
                <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
                {staffMember?.title && <p className="text-xs text-gray-500">{staffMember.title}</p>}
              </div>
            </div>
          )}

          {/* Children attending */}
          {children.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                <Users size={10} className="inline mr-1" />Barn i gruppen
              </p>
              <div className="flex flex-wrap gap-2">
                {children.map(c => (
                  <span key={c.id} className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {c.child_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
            <MapPin size={10} className="inline mr-1" />Sted i bygget
          </p>
          {show3d ? (
            <div className="rounded-2xl overflow-hidden mb-3" style={{ height: '50vh' }}>
              <iframe src={TOUR_URL} className="w-full h-full border-0" allowFullScreen allow="xr-spatial-tracking" title="3D-omvisning BHS" />
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl p-3 mb-2">
              <BygningKart location={activity.location} ledsagerPos={ledsagerPos} />
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5 mb-3 text-xs text-gray-400">
            {gpsStatus === 'loading' && <><div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />Henter posisjon…</>}
            {gpsStatus === 'ok' && <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-green-600">Posisjon oppdatert · unøyaktig innendørs</span></>}
            {(gpsStatus === 'denied' || gpsStatus === 'unsupported') && 'Skjematisk oversikt — ikke i målestokk'}
          </div>
          <button onClick={() => setShow3d(v => !v)}
            className="w-full rounded-2xl bg-blue-50 text-blue-700 font-semibold py-2.5 text-sm flex items-center justify-center gap-2 mb-5 active:scale-95 transition-all">
            <Box size={15} />
            {show3d ? '← Tilbake til kart' : 'Se 3D-omvisning av bygget'}
          </button>

          {/* Leder actions */}
          {isLeder && (
            <div className="flex gap-2">
              <button onClick={() => setShowStatusPicker(true)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm active:scale-95 transition-all">
                Sett status
              </button>
              {onAttendance && (
                <button onClick={onAttendance}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm active:scale-95 transition-all">
                  Fremmøte
                </button>
              )}
              {onEdit && (
                <button onClick={onEdit}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-all">
                  Rediger
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showStatusPicker && (
        <StatusPicker
          activityId={activity.id}
          current={liveStatus?.status ?? null}
          note={liveStatus?.note ?? null}
          staffName={staffName}
          date={date}
          onSave={s => { onStatusSave(s); }}
          onClose={() => setShowStatusPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Next activity card ───────────────────────────────────────────────────────

function NextActivityCard({ activity, liveStatus, staffMember, isCurrent, onClick }: {
  activity: Activity;
  liveStatus: ActivityStatus | null;
  staffMember: StaffMember | null;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const isAvlyst = liveStatus?.status === 'avlyst';
  const displayName = staffMember?.name ?? activity.staff_name;
  const load = activity.load_level ? LOAD[activity.load_level] : null;
  const statusMeta = liveStatus ? STATUS_META[liveStatus.status] : null;

  const timeLabel = isCurrent
    ? formatRemaining(activity.time_end)
    : formatUntil(activity.time_start);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl p-5 shadow-lg active:scale-[0.98] transition-all ${
        isAvlyst ? 'bg-gray-200' : isCurrent
          ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-500/25'
          : 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-500/20'
      }`}
    >
      {/* Top row: label + status */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold tracking-widest uppercase ${isAvlyst ? 'text-gray-500' : 'text-blue-200/80'}`}>
          {isCurrent ? 'Pågår nå' : 'Neste aktivitet'}
        </span>
        <div className="flex items-center gap-2">
          {statusMeta ? (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />{statusMeta.label}
              {liveStatus?.note && <span className="font-normal"> · {liveStatus.note}</span>}
            </span>
          ) : isCurrent ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Pågår
            </span>
          ) : null}
        </div>
      </div>

      {/* Activity name */}
      <h3 className={`text-2xl font-black leading-tight mb-1 ${isAvlyst ? 'line-through text-gray-500' : 'text-white'}`}>
        {activity.name}
      </h3>

      {/* Time */}
      <p className={`text-sm mb-4 ${isAvlyst ? 'text-gray-500' : 'text-blue-200/70'}`}>
        {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
        {timeLabel && !isAvlyst && <span className="ml-1 font-semibold text-white/80">· {timeLabel}</span>}
      </p>

      {/* Bottom row: location + staff + chevron */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activity.location && (
            <span className={`text-xs flex items-center gap-1 ${isAvlyst ? 'text-gray-500' : 'text-blue-200/70'}`}>
              <MapPin size={11} />{activity.location}
            </span>
          )}
          {load && !isAvlyst && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${load.bg} ${load.text}`}>
              {load.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {displayName && (
            <StaffAvatar name={displayName} photoUrl={staffMember?.photo_url ?? null} size="sm" />
          )}
          <ChevronRight size={16} className={isAvlyst ? 'text-gray-400' : 'text-white/50'} />
        </div>
      </div>
    </button>
  );
}

// ─── Unread messages widget ───────────────────────────────────────────────────

function MessagesCard() {
  const [counts, setCounts] = useState<{ gruppe: number; stab: number }>({ gruppe: 0, stab: 0 });

  useEffect(() => {
    const senderName = localStorage.getItem('lederMode') === 'true'
      ? (localStorage.getItem('staffName') || 'Leder')
      : (localStorage.getItem('parentName') || localStorage.getItem('childName') || '');
    const seenGruppe = localStorage.getItem('msgSeenAt_gruppe') ?? new Date(0).toISOString();
    const seenStab = localStorage.getItem('msgSeenAt_stab') ?? new Date(0).toISOString();

    Promise.all([
      supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('channel', 'gruppe').gt('created_at', seenGruppe).neq('sender_name', senderName),
      supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('channel', 'stab').gt('created_at', seenStab).neq('sender_name', senderName),
    ]).then(([g, s]) => {
      setCounts({ gruppe: g.count ?? 0, stab: s.count ?? 0 });
    });
  }, []);

  const total = counts.gruppe + counts.stab;

  return (
    <Link href="/chat"
      className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <MessageCircle size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Meldinger</p>
          {total > 0 ? (
            <p className="text-xs text-gray-500">
              {counts.gruppe > 0 && `${counts.gruppe} ny${counts.gruppe > 1 ? 'e' : ''} i Gruppe`}
              {counts.gruppe > 0 && counts.stab > 0 && ' · '}
              {counts.stab > 0 && `${counts.stab} ny${counts.stab > 1 ? 'e' : ''} fra Stab`}
            </p>
          ) : (
            <p className="text-xs text-gray-400">Ingen uleste meldinger</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {total > 0 && (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
            {total > 9 ? '9+' : total}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </Link>
  );
}

// ─── Fellesrom mini ───────────────────────────────────────────────────────────

function FellesromMini() {
  const [checkins, setCheckins] = useState<RoomCheckin[]>([]);

  useEffect(() => {
    supabase.from('room_checkins').select('*')
      .gt('expires_at', new Date().toISOString())
      .order('checked_in_at')
      .then(({ data }) => setCheckins((data ?? []) as RoomCheckin[]));
  }, []);

  useEffect(() => {
    const channel = supabase.channel('checkins-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_checkins' }, payload => {
        if (payload.eventType === 'INSERT') {
          const c = payload.new as RoomCheckin;
          setCheckins(prev => new Date(c.expires_at) > new Date() ? [...prev.filter(x => x.id !== c.id), c] : prev);
        } else if (payload.eventType === 'DELETE') {
          setCheckins(prev => prev.filter(c => c.id !== (payload.old as RoomCheckin).id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Link href="/fellesrom"
      className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">I fellesrom nå</p>
          {checkins.length === 0 ? (
            <p className="text-xs text-gray-400">Ingen er ute akkurat nå</p>
          ) : (
            <p className="text-xs text-gray-500 leading-relaxed">
              {checkins.slice(0, 3).map(c => `${c.parent_name} · ${c.room_name}`).join(' — ')}
              {checkins.length > 3 && ` +${checkins.length - 3} til`}
            </p>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </Link>
  );
}

// ─── No activities state ──────────────────────────────────────────────────────

function NoActivityCard() {
  return (
    <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100">
      <p className="text-3xl mb-2">🎉</p>
      <p className="font-bold text-gray-700">Fri resten av dagen!</p>
      <p className="text-sm text-gray-400 mt-1">Ingen flere aktiviteter i dag</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StatusDashboard() {
  const [childName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Evelina';
    const stored = localStorage.getItem('childName');
    if (stored) return stored;
    localStorage.setItem('childName', 'Evelina');
    return 'Evelina';
  });
  const isStaff = typeof window !== 'undefined' && localStorage.getItem('lederMode') === 'true';
  const staffName = typeof window !== 'undefined' ? (localStorage.getItem('staffName') || 'Leder') : 'Leder';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({});
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember>>({});
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [attendanceActivity, setAttendanceActivity] = useState<Activity | null>(null);

  // Refresh time every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch staff — only needed for leder detail view
  useEffect(() => {
    if (!isStaff) return;
    supabase.from('staff').select('*').then(({ data }) => {
      if (data) {
        const m: Record<string, StaffMember> = {};
        for (const s of data) m[s.id] = s as StaffMember;
        setStaffMap(m);
      }
    });
  }, [isStaff]);

  // Fetch child profiles — only needed for leder attendance view
  useEffect(() => {
    if (!isStaff) return;
    supabase.from('child_profiles').select('*').then(({ data }) => {
      if (data) setChildProfiles(data as ChildProfile[]);
    });
  }, [isStaff]);

  // Fetch activities + statuses in parallel — direct Supabase queries, no serverless round-trip
  useEffect(() => {
    const today = cestDate().toISOString().slice(0, 10);
    const dayOfWeek = todayDayOfWeek();
    const ws = currentWeekStart();
    const weDate = new Date(ws + 'T12:00:00');
    weDate.setUTCDate(weDate.getUTCDate() + 6);
    const we = weDate.toISOString().slice(0, 10);

    // Show cached activities immediately so the screen isn't blank while fetching
    try {
      const cached = localStorage.getItem(`sd_acts_${today}`);
      if (cached) {
        const parsed = JSON.parse(cached) as Activity[];
        setActivities(
          parsed
            .filter(a => !a.target_child || a.target_child.toLowerCase() === childName.toLowerCase())
            .sort((a, b) => a.time_start.localeCompare(b.time_start))
        );
        setLoading(false);
      }
    } catch {}

    Promise.all([
      supabase.from('activities').select('*').eq('is_fritid', false).gte('week_start', ws).lte('week_start', we).order('day_of_week').order('time_start'),
      supabase.from('activities').select('*').eq('is_fritid', true).gte('week_start', ws).lte('week_start', we).order('day_of_week').order('time_start'),
      supabase.from('activity_status').select('*').eq('date', today),
    ])
      .then(([{ data: acts }, { data: frits }, { data: statusData }]) => {
        const all: Activity[] = [...((acts as Activity[]) ?? []), ...((frits as Activity[]) ?? [])];
        const todayActs = all
          .filter(a => a.day_of_week === dayOfWeek)
          .filter(a => !a.target_child || a.target_child.toLowerCase() === childName.toLowerCase())
          .sort((a, b) => a.time_start.localeCompare(b.time_start));
        setActivities(todayActs);
        const map: Record<string, ActivityStatus> = {};
        for (const s of ((statusData as ActivityStatus[]) ?? [])) map[s.activity_id] = s;
        setStatuses(map);
        setLoading(false);
        try { localStorage.setItem(`sd_acts_${today}`, JSON.stringify(all.filter(a => a.day_of_week === dayOfWeek))); } catch {}
      })
      .catch(() => setLoading(false));
  }, [childName]);

  // Realtime status updates
  useEffect(() => {
    const today = cestDate().toISOString().slice(0, 10);
    const channel = supabase.channel('activity_status_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_status', filter: `date=eq.${today}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            setStatuses(prev => { const n = { ...prev }; delete n[(payload.old as ActivityStatus).activity_id]; return n; });
          } else {
            const s = payload.new as ActivityStatus;
            setStatuses(prev => ({ ...prev, [s.activity_id]: s }));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const today = cestDate().toISOString().slice(0, 10);
  const mins = nowMins();
  const current = activities.find(a => toMins(a.time_start) <= mins && toMins(a.time_end) >= mins) ?? null;
  const nextUpcoming = activities.find(a => toMins(a.time_start) > mins) ?? null;
  const featured = current ?? nextUpcoming;

  return (
    <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Hei, {childName.split(' ')[0]} 👋</h2>
        <p className="text-sm text-gray-500 capitalize">
          {format(cestDate(), 'EEEE d. MMMM', { locale: nb })}
        </p>
      </div>

      {/* Dagsform */}
      <DagsformWidget childName={childName} isLeder={isStaff} />

      {/* Activity card */}
      {loading ? (
        <div className="rounded-3xl bg-blue-100 h-44 animate-pulse" />
      ) : featured ? (
        <NextActivityCard
          activity={featured}
          liveStatus={statuses[featured.id] ?? null}
          staffMember={featured.staff_id ? (staffMap[featured.staff_id] ?? null) : null}
          isCurrent={current !== null}
          onClick={() => setDetailActivity(featured)}
        />
      ) : (
        <NoActivityCard />
      )}

      {/* Messages + Fellesrom */}
      <MessagesCard />
      <FellesromMini />

      {/* Detail modal */}
      {detailActivity && (
        <ActivityDetailModal
          activity={detailActivity}
          liveStatus={statuses[detailActivity.id] ?? null}
          staffMember={detailActivity.staff_id ? (staffMap[detailActivity.staff_id] ?? null) : null}
          children={childProfiles}
          isLeder={isStaff}
          staffName={staffName}
          date={today}
          onStatusSave={s => setStatuses(prev => ({ ...prev, [s.activity_id]: s }))}
          onEdit={isStaff ? () => { setDetailActivity(null); setEditActivity(detailActivity); } : undefined}
          onAttendance={isStaff ? () => { setDetailActivity(null); setAttendanceActivity(detailActivity); } : undefined}
          onClose={() => setDetailActivity(null)}
        />
      )}

      {/* Edit activity (leder) */}
      {editActivity && (
        <ActivityEditModal
          activity={editActivity}
          allStaff={Object.values(staffMap)}
          onClose={() => setEditActivity(null)}
          onSaved={({ load_level, staffIds }) => {
            setActivities(prev => prev.map(a =>
              a.id === editActivity.id ? { ...a, load_level, staff_id: staffIds[0] ?? null } : a
            ));
          }}
        />
      )}

      {/* Attendance (leder) */}
      {attendanceActivity && (
        <AttendanceModal
          activity={attendanceActivity}
          date={today}
          markedBy={staffName}
          onClose={() => setAttendanceActivity(null)}
        />
      )}
    </div>
  );
}

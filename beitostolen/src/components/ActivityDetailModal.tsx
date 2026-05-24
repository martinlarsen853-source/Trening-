'use client';

import { useState } from 'react';
import type { TimeplanActivity } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { StaffSpotlightModal } from './StaffSpotlightModal';
import { MapModal } from './MapModal';
import { LOCATION_TO_BUILDING } from '@/lib/locationMap';
import { X, Clock, MapPin, Map } from 'lucide-react';

const DAYS = ['', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

const GROUP_MEMBERS: Record<string, string[]> = {
  blå: ['Jakob', 'Lukas', 'Lars', 'Johannes'],
  gul: ['Sigurd', 'Alice', 'Evelina', 'Marianna', 'Mia'],
};

const LOAD_CONFIG = {
  lav: {
    pill: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    label: 'Lav belastning',
    desc: 'Rolig aktivitet, passer de fleste',
  },
  middels: {
    pill: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    label: 'Middels belastning',
    desc: 'Moderat intensitet — følg barnets signaler',
  },
  høy: {
    pill: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    label: 'Høy belastning',
    desc: 'Krevende aktivitet — observer barnets dagsform',
  },
} as const;

type Props = {
  activity: TimeplanActivity;
  myAbsence: boolean;
  otherAbsences: string[];
  childName: string;
  onClose: () => void;
  onToggle: () => Promise<void>;
  isStaff?: boolean;
  onEdit?: () => void;
};

export function ActivityDetailModal({
  activity,
  myAbsence,
  otherAbsences,
  childName,
  onClose,
  onToggle,
  isStaff,
  onEdit,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [spotlight, setSpotlight] = useState<{ name: string; photoUrl: string | null } | null>(null);
  const [showMap, setShowMap] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await onToggle();
    setLoading(false);
    onClose();
  }

  const load = activity.load_level ? LOAD_CONFIG[activity.load_level as keyof typeof LOAD_CONFIG] : null;
  const groupMembers = activity.group_name ? GROUP_MEMBERS[activity.group_name] : null;
  const buildingId = activity.location ? LOCATION_TO_BUILDING[activity.location] : undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 px-0 sm:items-center sm:px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[90dvh] flex flex-col">

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-2">

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                {DAYS[activity.day_of_week] ?? ''}
              </p>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 -mt-1 -mr-1 flex-shrink-0">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
              {activity.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock size={14} className="text-gray-400" />
                {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  {activity.location}
                </span>
              )}
              {buildingId && (
                <button
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  <Map size={13} />
                  Vis på kart
                </button>
              )}
            </div>

            {/* Load level */}
            {load && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Belastningsnivå</p>
                <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl ${load.pill}`}>
                  <span className={`w-2 h-2 rounded-full ${load.dot}`} />
                  <span className="text-sm font-bold">{load.label}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1.5 ml-1">{load.desc}</p>
              </div>
            )}

            {/* Staff — tappable */}
            {activity.staff.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Leder aktiviteten</p>
                <div className="flex flex-wrap gap-4">
                  {activity.staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSpotlight({ name: s.name, photoUrl: s.photo_url })}
                      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                    >
                      <StaffAvatar name={s.name} photoUrl={s.photo_url} size="xl" />
                      <span className="text-sm font-semibold text-gray-800 text-center">{s.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-0.5">Trykk på bildet for å se større</p>
              </div>
            )}

            {/* Group members */}
            {groupMembers && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Deltakere</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activity.group_name === 'blå' ? 'bg-blue-500' : 'bg-amber-400'}`} />
                  <span className={`text-sm font-bold ${activity.group_name === 'blå' ? 'text-blue-700' : 'text-amber-700'}`}>
                    Gruppe {activity.group_name === 'blå' ? 'Blå' : 'Gul'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupMembers.map((name) => (
                    <span
                      key={name}
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        name.toLowerCase() === childName.toLowerCase()
                          ? activity.group_name === 'blå' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'
                          : activity.group_name === 'blå' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Absences */}
            {otherAbsences.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Melder ikke</p>
                <div className="flex flex-wrap gap-2">
                  {otherAbsences.map((name) => (
                    <span key={name} className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {activity.notes && (
              <div className="mb-5 bg-blue-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Informasjon</p>
                <div className="flex flex-col gap-1">
                  {activity.notes.split(' · ').map((line, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-snug">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky bottom — meld avbud */}
          <div className="px-6 pt-3 pb-6 border-t border-gray-100 flex flex-col gap-2">
            {isStaff && onEdit && (
              <button
                onClick={() => { onClose(); onEdit(); }}
                className="w-full rounded-xl py-3 text-base font-semibold text-blue-600 bg-blue-50 active:scale-95 transition-transform"
              >
                Rediger aktivitet →
              </button>
            )}
            <p className="text-sm text-gray-500">
              {myAbsence
                ? `${childName} er meldt som ikke kommende.`
                : `Meld ${childName} som ikke kommende til denne aktiviteten?`}
            </p>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`w-full rounded-xl py-3.5 text-base font-semibold active:scale-95 transition-transform disabled:opacity-50 ${
                myAbsence
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-red-500 text-white'
              }`}
            >
              {loading ? '...' : myAbsence ? 'Angre avbud' : 'Meld avbud'}
            </button>
          </div>
        </div>
      </div>

      {/* Overlays rendered above the modal */}
      {spotlight && (
        <StaffSpotlightModal
          name={spotlight.name}
          photoUrl={spotlight.photoUrl}
          onClose={() => setSpotlight(null)}
        />
      )}
      {showMap && buildingId && (
        <MapModal
          location={activity.location!}
          buildingId={buildingId}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  );
}

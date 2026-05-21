'use client';

import { useState } from 'react';
import type { Activity, Absence } from '@/lib/supabase';
import { X } from 'lucide-react';

type Props = {
  activity: Activity;
  absences: Absence[];
  childName: string;
  onClose: () => void;
  onToggle: (activityId: string, childName: string, existingId?: string) => Promise<void>;
};

export function AbsenceModal({ activity, absences, childName, onClose, onToggle }: Props) {
  const [loading, setLoading] = useState(false);

  const myAbsence = absences.find(
    (a) => a.activity_id === activity.id && a.child_name === childName
  );

  const otherAbsences = absences.filter(
    (a) => a.activity_id === activity.id && a.child_name !== childName
  );

  async function handleToggle() {
    setLoading(true);
    await onToggle(activity.id, childName, myAbsence?.id);
    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 sm:items-center sm:px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              {['', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'][activity.day_of_week]}
            </p>
            <h2 className="text-xl font-bold text-gray-900">{activity.name}</h2>
            <p className="text-gray-500 text-sm">
              {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
              {activity.location && ` · ${activity.location}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
            <X size={22} />
          </button>
        </div>

        {otherAbsences.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Melder ikke</p>
            <div className="flex flex-wrap gap-2">
              {otherAbsences.map((a) => (
                <span key={a.id} className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
                  {a.child_name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600 mb-4">
            {myAbsence
              ? `Du har meldt ${childName} som ikke kommende.`
              : `Meld ${childName} som ikke kommende til denne aktiviteten?`}
          </p>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-full rounded-xl py-3.5 text-base font-semibold active:scale-95 transition-transform disabled:opacity-50 ${
              myAbsence
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {loading ? '...' : myAbsence ? 'Angre avbud' : 'Meld avbud'}
          </button>
        </div>
      </div>
    </div>
  );
}

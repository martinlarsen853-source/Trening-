'use client';

import type { Activity, Absence } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

type Props = {
  activity: Activity;
  absences: Absence[];
  childName: string;
  onClick: () => void;
};

export function ActivityCard({ activity, absences, childName, onClick }: Props) {
  const relevant = absences.filter((a) => a.activity_id === activity.id);
  const myAbsence = relevant.find((a) => a.child_name === childName);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-[0.98] ${
        myAbsence
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}
            </span>
            {activity.notes && (
              <span className="text-xs text-gray-400">{activity.notes}</span>
            )}
          </div>
          <p className="font-bold text-gray-900 text-base leading-tight">{activity.name}</p>
          {activity.location && (
            <p className="text-sm text-gray-500 mt-0.5">{activity.location}</p>
          )}
        </div>
        {myAbsence && (
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-1" />
        )}
      </div>

      {relevant.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {relevant.map((a) => (
            <span
              key={a.id}
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                a.child_name === childName
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {a.child_name} kommer ikke
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

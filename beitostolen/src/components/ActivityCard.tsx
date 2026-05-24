'use client';

import type { TimeplanActivity } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { ChevronRight, Pencil } from 'lucide-react';

type Props = {
  activity: TimeplanActivity;
  myAbsence: boolean;
  relevantAbsences: string[];
  onClick: () => void;
  onEdit?: () => void;
};

export function ActivityCard({ activity, myAbsence, relevantAbsences, onClick, onEdit }: Props) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`w-full text-left rounded-3xl border p-5 transition-all active:scale-[0.99] ${
          myAbsence
            ? 'border-red-200 bg-red-50/60'
            : activity.is_adult_meeting
            ? 'border-green-200 bg-green-50/70 hover:border-green-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex flex-col items-center justify-center rounded-2xl px-3 py-2 min-w-[68px] ${
            activity.is_adult_meeting
              ? 'bg-gradient-to-br from-green-50 to-green-100'
              : 'bg-gradient-to-br from-blue-50 to-blue-100'
          }`}>
            <span className={`text-base font-bold tabular-nums leading-tight ${activity.is_adult_meeting ? 'text-green-900' : 'text-blue-900'}`}>
              {activity.time_start.slice(0, 5)}
            </span>
            <span className={`text-[10px] font-medium tabular-nums tracking-wide ${activity.is_adult_meeting ? 'text-green-500' : 'text-blue-500'}`}>
              — {activity.time_end.slice(0, 5)}
            </span>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-gray-900 text-base leading-tight tracking-tight">
              {activity.name}
            </p>
            {activity.load_level && (
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                activity.load_level === 'lav'
                  ? 'bg-green-100 text-green-700'
                  : activity.load_level === 'middels'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {activity.load_level === 'lav' ? '🟢 Lav belastning'
                  : activity.load_level === 'middels' ? '🟡 Middels belastning'
                  : '🔴 Høy belastning'}
              </span>
            )}
            {activity.group_name === 'blå' && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-700">Jakob · Lukas · Lars · Johannes</span>
              </div>
            )}
            {activity.group_name === 'gul' && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-700">Sigurd · Alice · Evelina · Marianna · Mia</span>
              </div>
            )}
            {activity.is_adult_meeting && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-green-700">For ledsagere</span>
              </div>
            )}
            {activity.location && (
              <p className="text-sm text-gray-500 mt-0.5">{activity.location}</p>
            )}
            {activity.staff.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {activity.staff.map((s) => (
                  <div key={s.id} className="flex items-center gap-1">
                    <StaffAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                    <span className="text-xs text-gray-600 font-medium">{s.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
            {activity.notes && (
              <p className="text-xs text-gray-400 mt-0.5 italic">{activity.notes}</p>
            )}
          </div>

          {/* Right icon — edit pencil in leder mode, otherwise chevron */}
          {onEdit ? (
            <div className="w-6 flex-shrink-0 mt-1" />
          ) : (
            <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
          )}
        </div>

        {relevantAbsences.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pl-[80px]">
            {relevantAbsences.map((name) => (
              <span
                key={name}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  myAbsence && name.toLowerCase() === activity.target_child?.toLowerCase()
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {name} kommer ikke
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Edit pencil — outside the main button to avoid button-in-button */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 shadow-sm active:scale-95 transition-transform"
          aria-label="Rediger aktivitet"
        >
          <Pencil size={13} className="text-gray-500" />
        </button>
      )}
    </div>
  );
}

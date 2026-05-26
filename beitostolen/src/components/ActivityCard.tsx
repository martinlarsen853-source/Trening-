'use client';

import type { Activity, Absence } from '@/lib/supabase';
import { ChevronRight } from 'lucide-react';

type Props = {
  activity: Activity;
  absences: Absence[];
  childName: string;
  onClick: () => void;
};

const PARTICLES: { x: string; e: string; d: number; t: number; anim: string }[] = [
  { x: '5%',  e: '✨', d: 0,    t: 1.5, anim: 'dinner-float-l' },
  { x: '15%', e: '🎉', d: 0.4,  t: 1.8, anim: 'dinner-float-r' },
  { x: '27%', e: '⭐', d: 0.7,  t: 1.4, anim: 'dinner-float-u' },
  { x: '38%', e: '🌟', d: 0.2,  t: 1.7, anim: 'dinner-float-l' },
  { x: '50%', e: '✨', d: 0.9,  t: 1.3, anim: 'dinner-float-r' },
  { x: '61%', e: '🎊', d: 0.15, t: 1.6, anim: 'dinner-float-u' },
  { x: '72%', e: '💫', d: 0.55, t: 1.5, anim: 'dinner-float-l' },
  { x: '83%', e: '⭐', d: 0.35, t: 1.8, anim: 'dinner-float-r' },
  { x: '93%', e: '🎉', d: 0.8,  t: 1.4, anim: 'dinner-float-u' },
  { x: '10%', e: '💥', d: 1.1,  t: 1.6, anim: 'dinner-float-r' },
  { x: '44%', e: '🌟', d: 0.6,  t: 1.7, anim: 'dinner-float-l' },
  { x: '78%', e: '✨', d: 1.0,  t: 1.3, anim: 'dinner-float-u' },
];

function CelebrationSparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            bottom: '15%',
            fontSize: '13px',
            lineHeight: 1,
            animation: `${p.anim} ${p.t}s ${p.d}s ease-out infinite`,
          }}
        >
          {p.e}
        </span>
      ))}
    </div>
  );
}

export function ActivityCard({ activity, absences, childName, onClick }: Props) {
  const relevant = absences.filter((a) => a.activity_id === activity.id);
  const myAbsence = relevant.find((a) => a.child_name === childName);

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-3xl border p-5 transition-all active:scale-[0.99] ${
        myAbsence
          ? 'border-red-200 bg-red-50/60'
          : activity.is_dinner
          ? 'border-orange-200'
          : activity.is_adult_meeting
          ? 'border-green-200 bg-green-50/70 hover:border-green-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
      }`}
      style={activity.is_dinner ? {
        animation: 'dinner-glow 3s ease-in-out infinite, dinner-pulse-bg 3s ease-in-out infinite',
      } : {}}
    >
      {/* Shimmer sweep */}
      {activity.is_dinner && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 bottom-0 w-[28%] bg-gradient-to-r from-transparent via-white/50 to-transparent"
            style={{ animation: 'dinner-shimmer 2.8s 0.5s ease-in-out infinite' }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`flex flex-col items-center justify-center rounded-2xl px-3 py-2 min-w-[68px] ${
          activity.is_dinner
            ? 'bg-gradient-to-br from-orange-100 to-amber-200'
            : activity.is_adult_meeting
            ? 'bg-gradient-to-br from-green-50 to-green-100'
            : 'bg-gradient-to-br from-blue-50 to-blue-100'
        }`}>
          <span className={`text-base font-bold tabular-nums leading-tight ${
            activity.is_dinner ? 'text-orange-900' : activity.is_adult_meeting ? 'text-green-900' : 'text-blue-900'
          }`}>
            {activity.time_start.slice(0, 5)}
          </span>
          <span className={`text-[10px] font-medium tabular-nums tracking-wide ${
            activity.is_dinner ? 'text-orange-500' : activity.is_adult_meeting ? 'text-green-500' : 'text-blue-500'
          }`}>
            — {activity.time_end.slice(0, 5)}
          </span>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`font-bold text-base leading-tight tracking-tight ${
            activity.is_dinner ? 'text-orange-900' : 'text-gray-900'
          }`}>
            {activity.name}
          </p>
          {(activity.group_name === 'blå' || activity.group_name === 'alle') && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-700">Jakob · Lukas · Lars · Johannes</span>
            </div>
          )}
          {(activity.group_name === 'gul' || activity.group_name === 'alle') && (
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
            <p className={`text-sm mt-0.5 ${activity.is_dinner ? 'text-orange-700' : 'text-gray-500'}`}>
              {activity.location}
            </p>
          )}
          {activity.notes && (
            <p className={`text-xs mt-0.5 italic ${activity.is_dinner ? 'text-orange-600' : 'text-gray-400'}`}>
              {activity.notes}
            </p>
          )}
        </div>

        <ChevronRight size={18} className={`flex-shrink-0 mt-1 ${activity.is_dinner ? 'text-orange-300' : 'text-gray-300'}`} />
      </div>

      {relevant.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pl-[80px]">
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

      {activity.is_dinner && <CelebrationSparkles />}
    </button>
  );
}

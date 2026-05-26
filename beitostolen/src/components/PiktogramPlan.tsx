'use client';

import { addDays, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { TimeplanDay } from '@/lib/supabase';

type Props = {
  days: TimeplanDay[];
  childName: string;
  weekStart: Date;
};

const DAY_HEADER: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: '#E8846A', text: '#fff', label: 'Mandag' },
  2: { bg: '#6AAFE8', text: '#fff', label: 'Tirsdag' },
  3: { bg: '#6AC9A4', text: '#fff', label: 'Onsdag' },
  4: { bg: '#9B7EE8', text: '#fff', label: 'Torsdag' },
  5: { bg: '#E8C86A', text: '#5a4a00', label: 'Fredag' },
  6: { bg: '#E87AB0', text: '#fff', label: 'Lørdag' },
  7: { bg: '#A0A8B8', text: '#fff', label: 'Søndag' },
};

const DAY_CARD_BG: Record<number, string> = {
  1: '#FFF0EC', 2: '#EEF6FF', 3: '#EEFAF5',
  4: '#F3EEFF', 5: '#FEFAEC', 6: '#FFF0F7', 7: '#F3F4F6',
};

function getEmoji(name: string, location?: string | null): string {
  const n = (name + ' ' + (location ?? '')).toLowerCase();
  if (n.includes('basseng') || n.includes('svøm')) return '🏊';
  if (n.includes('idrettshall')) return '🏀';
  if (n.includes('gymsal') || n.includes('gym')) return '🤸';
  if (n.includes('ridehall') || n.includes('riding') || n.includes('hest')) return '🐴';
  if (n.includes('sykkel') || n.includes('sykling')) return '🚲';
  if (n.includes('bading') || n.includes('bad')) return '🛁';
  if (/\bgåtur\b|\btur\b/.test(n)) return '🚶';
  if (n.includes('frokost')) return '🍳';
  if (n.includes('lunsj')) return '🥗';
  if (n.includes('middag')) return '🍽️';
  if (n.includes('kveldsmat') || n.includes('kveldsniste')) return '🥛';
  if (n.includes('mat') || n.includes('spisesal')) return '🍽️';
  if (n.includes('skole')) return '📚';
  if (n.includes('frilek') || n.includes('leke') || n.includes('lek')) return '🎨';
  if (n.includes('musikk') || n.includes('sang') || n.includes('konsert')) return '🎵';
  if (n.includes('maling') || n.includes('kunst')) return '🖌️';
  if (n.includes('morgenmøte') || n.includes('morgensamling')) return '☀️';
  if (n.includes('kveldsmøte') || n.includes('kveldssamling')) return '🌙';
  if (n.includes('møte') || n.includes('samtale')) return '💬';
  if (n.includes('reise') || n.includes('avreise') || n.includes('avgang')) return '🧳';
  if (n.includes('hjem') || n.includes('avslutning')) return '🏠';
  if (n.includes('ball')) return '⚽';
  if (n.includes('dans')) return '💃';
  if (n.includes('klatre')) return '🧗';
  if (n.includes('yoga') || n.includes('avslapning')) return '🧘';
  return '⭐';
}

function getMealsForDay(dayOfWeek: number) {
  if (dayOfWeek >= 6) {
    return [{ name: 'Lunsj / Middag', time: '12:00' }];
  }
  return [
    { name: 'Lunsj', time: '11:45' },
    { name: 'Middag', time: '15:30' },
  ];
}

export function PiktogramPlan({ days, childName, weekStart }: Props) {
  const allDayNums = [...new Set([1, 2, 3, 4, 5, 6, 7, ...days.map(d => d.dayOfWeek)])].sort();

  return (
    <div className="overflow-x-auto pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-3 px-4 pt-2" style={{ minWidth: 'max-content' }}>
        {allDayNums.map((dayNum) => {
          const header = DAY_HEADER[dayNum];
          const cardBg = DAY_CARD_BG[dayNum] ?? '#f9fafb';
          const date = addDays(weekStart, dayNum - 1);
          const dayData = days.find(d => d.dayOfWeek === dayNum);
          const isWeekend = dayNum >= 6;

          const activities = [
            ...(dayData?.main ?? []).filter(
              a => !a.target_child || a.target_child.toLowerCase() === childName.toLowerCase()
            ),
            ...(isWeekend ? (dayData?.fritid ?? []) : []),
          ];

          const meals = getMealsForDay(dayNum);

          type Item =
            | { kind: 'activity'; id: string; name: string; location: string | null; time: string; absent: boolean }
            | { kind: 'meal'; name: string; time: string };

          const items: Item[] = [
            ...activities.map(a => ({
              kind: 'activity' as const,
              id: a.id,
              name: a.name,
              location: a.location,
              time: a.time_start.slice(0, 5),
              absent: a.myAbsence,
            })),
            ...meals.map(m => ({ kind: 'meal' as const, name: m.name, time: m.time })),
          ].sort((a, b) => a.time.localeCompare(b.time));

          if (!header) return null;

          return (
            <div
              key={dayNum}
              className="flex flex-col rounded-2xl overflow-hidden shadow-sm border border-gray-200"
              style={{ width: 148 }}
            >
              {/* Header */}
              <div
                className="py-3 px-2 text-center font-bold text-base uppercase tracking-wide"
                style={{ backgroundColor: header.bg, color: header.text }}
              >
                <div>{header.label}</div>
                <div className="text-xs font-normal mt-0.5 opacity-80">
                  {format(date, 'd. MMM', { locale: nb })}
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2" style={{ backgroundColor: cardBg }}>
                {items.length === 0 ? (
                  <div className="py-6 text-center text-2xl opacity-30">—</div>
                ) : (
                  items.map((item, i) => (
                    <div
                      key={item.kind === 'activity' ? item.id : `meal-${i}`}
                      className={`rounded-xl border-2 border-white bg-white flex flex-col items-center gap-1 p-2 shadow-sm ${
                        item.kind === 'activity' && item.absent ? 'opacity-35' : ''
                      }`}
                    >
                      {item.kind === 'activity' && item.absent && (
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide -mb-1">Avbud</span>
                      )}
                      <div className="text-5xl leading-none py-1 select-none">
                        {item.kind === 'meal'
                          ? (item.name.toLowerCase().includes('frokost') ? '🍳' : item.name.toLowerCase().includes('lunsj') ? '🥗' : '🍽️')
                          : getEmoji(item.name, item.location)}
                      </div>
                      <p className="text-[12px] font-semibold text-gray-800 text-center leading-tight">
                        {item.name.toLowerCase()}
                      </p>
                      <p className="text-[10px] text-gray-400">{item.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const FLAG_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  badetoy:         { label: 'Husk badetøy',         icon: '🩱', bg: 'bg-sky-100',     text: 'text-sky-700'     },
  skifte_toy:      { label: 'Endre tøy etter',       icon: '👕', bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  lydfolsomt:      { label: 'Støyfull start',         icon: '👂', bg: 'bg-red-100',     text: 'text-red-700'     },
  krever_ledsager: { label: 'Krever ledsager',        icon: '👤', bg: 'bg-amber-100',   text: 'text-amber-700'   },
  rolig_overgang:  { label: 'Rolig overgang',         icon: '🚶', bg: 'bg-teal-100',    text: 'text-teal-700'    },
  husk_utstyr:     { label: 'Husk utstyr',            icon: '🎒', bg: 'bg-purple-100',  text: 'text-purple-700'  },
  pause_etter:     { label: 'Pause anbefalt etter',   icon: '☕', bg: 'bg-orange-100',  text: 'text-orange-700'  },
};

export function TransitionBadges({
  flags,
  note,
  size = 'md',
}: {
  flags: string[];
  note?: string | null;
  size?: 'sm' | 'md';
}) {
  if (flags.length === 0 && !note) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((f) => {
            const c = FLAG_CONFIG[f];
            if (!c) return null;
            return (
              <span
                key={f}
                className={`inline-flex items-center gap-1 font-semibold rounded-full ${c.bg} ${c.text} ${
                  size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
                }`}
              >
                {c.icon} {c.label}
              </span>
            );
          })}
        </div>
      )}
      {note && (
        <p className={`text-gray-600 italic ${size === 'sm' ? 'text-[11px]' : 'text-sm'}`}>{note}</p>
      )}
    </div>
  );
}

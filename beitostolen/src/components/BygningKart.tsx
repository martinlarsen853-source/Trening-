'use client';

type Room = {
  id: string;
  label: string;
  sublabel?: string;
  x: number; y: number; w: number; h: number;
  outdoor?: boolean;
};

const ROOMS: Room[] = [
  { id: 'basseng',        label: 'Basseng',          x: 8,   y: 8,   w: 84,  h: 56  },
  { id: 'gymsal',         label: 'Gymsal',            x: 100, y: 8,   w: 66,  h: 56  },
  { id: 'idrettshall',    label: 'Idrettshall',       x: 174, y: 8,   w: 118, h: 56  },
  { id: 'aktivitetsrom1', label: 'Aktivitetsrom 1',   x: 8,   y: 72,  w: 86,  h: 42  },
  { id: 'lekerom',        label: 'Lekerom',           x: 102, y: 72,  w: 56,  h: 42  },
  { id: 'skole',          label: 'Skole',             x: 166, y: 72,  w: 56,  h: 42  },
  { id: 'kongensutsikt',  label: 'Kongens',           sublabel: 'Utsikt', x: 230, y: 72, w: 62, h: 42 },
  { id: 'stall',          label: 'Stall',             x: 8,   y: 130, w: 68,  h: 36, outdoor: true },
  { id: 'akv',            label: 'AKV-bygget',        x: 84,  y: 130, w: 86,  h: 36  },
];

const LOCATION_MAP: [string, string][] = [
  ['basseng',           'basseng'],
  ['gymsal',            'gymsal'],
  ['idrettshall',       'idrettshall'],
  ['aktivitetsrom 1',   'aktivitetsrom1'],
  ['aktivitetsrom',     'aktivitetsrom1'],
  ['lekerom',           'lekerom'],
  ['kongens utsikt',    'kongensutsikt'],
  ['kongens',           'kongensutsikt'],
  ['akv',               'akv'],
  ['legesekretær',      'akv'],
  ['skole',             'skole'],
  ['stall',             'stall'],
];

export function matchRoom(location: string | null): string | null {
  if (!location) return null;
  const lower = location.toLowerCase();
  for (const [key, id] of LOCATION_MAP) {
    if (lower.includes(key)) return id;
  }
  return null;
}

export function BygningKart({ location }: { location: string | null }) {
  const activeId = matchRoom(location);

  return (
    <svg viewBox="0 -8 300 178" className="w-full" style={{ fontFamily: 'system-ui,sans-serif' }}>
      {/* Inngang-pil */}
      <text x="150" y="-1" fontSize="6.5" textAnchor="middle" fill="#94a3b8">▼ Inngang</text>

      {/* Hovedbygg-ramme */}
      <rect x="4" y="4" width="290" height="114" rx="5"
        fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />

      {/* Utendørs-ramme */}
      <rect x="4" y="125" width="290" height="45" rx="5"
        fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" strokeDasharray="4 3" />
      <text x="8" y="136" fontSize="6" fill="#86efac">Utendørs</text>

      {/* Rom */}
      {ROOMS.map(room => {
        const active = room.id === activeId;
        const cx = room.x + room.w / 2;
        const cy = room.y + room.h / 2;
        return (
          <g key={room.id}>
            <rect
              x={room.x} y={room.y} width={room.w} height={room.h} rx="4"
              fill={active ? '#3b82f6' : room.outdoor ? '#dcfce7' : '#eff6ff'}
              stroke={active ? '#2563eb' : room.outdoor ? '#86efac' : '#bfdbfe'}
              strokeWidth={active ? 2 : 1}
            />
            <text x={cx} y={cy + (room.sublabel ? -3 : 3)} fontSize="7.5"
              textAnchor="middle" dominantBaseline="middle"
              fill={active ? 'white' : '#1d4ed8'}
              fontWeight={active ? '700' : '500'}>
              {room.label}
            </text>
            {room.sublabel && (
              <text x={cx} y={cy + 8} fontSize="7.5"
                textAnchor="middle" dominantBaseline="middle"
                fill={active ? 'white' : '#1d4ed8'}
                fontWeight={active ? '700' : '500'}>
                {room.sublabel}
              </text>
            )}
            {active && (
              <>
                <circle cx={cx} cy={room.y - 7} r="5" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                <text x={cx} y={room.y - 4} fontSize="7" textAnchor="middle" fill="white" fontWeight="bold">!</text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

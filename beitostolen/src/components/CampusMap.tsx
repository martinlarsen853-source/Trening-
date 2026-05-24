'use client';

type Building = {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
};

const BUILDINGS: Building[] = [
  { id: 'hjelpemiddelbygg', label: 'Hjelpemiddelbygg', x: 302, y: 28,  w: 188, h: 54  },
  { id: 'ridehall',         label: 'Ridehall',         x: 18,  y: 128, w: 188, h: 98  },
  { id: 'idrettshall',      label: 'Idrettshall',      x: 432, y: 128, w: 210, h: 112 },
  { id: 'stall',            label: 'Stall / adm',      x: 50,  y: 242, w: 165, h: 66  },
  { id: 'svommehall',       label: 'Svømmehall',       x: 432, y: 254, w: 210, h: 90  },
  { id: 'gymsal',           label: 'Gymsal / trim',    x: 408, y: 358, w: 208, h: 76  },
  { id: 'senter',           label: '',                 x: 348, y: 355, w: 66,  h: 210 },
  { id: 'hovedbygg',        label: 'Hovedbygg',        x: 140, y: 400, w: 196, h: 90  },
  { id: 'skole',            label: 'Skole',            x: 428, y: 447, w: 158, h: 74  },
  { id: 'lege',             label: 'Lege',             x: 600, y: 447, w: 108, h: 64  },
  { id: 'familiehus',       label: 'Familiehus',       x: 98,  y: 504, w: 175, h: 90  },
  { id: 'spisesal',         label: 'Spisesal',         x: 286, y: 500, w: 210, h: 96  },
  { id: 'paviljongen',      label: 'Paviljongen',      x: 650, y: 336, w: 118, h: 78  },
];

export function CampusMap({ activeBuilding }: { activeBuilding?: string }) {
  return (
    <svg
      viewBox="0 0 800 630"
      className="w-full h-full"
      style={{ maxHeight: '100%' }}
    >
      {/* Background */}
      <rect width="800" height="630" fill="#f0e6d8" />

      {/* Roads */}
      {/* Main ring road - approximate path */}
      <path
        d="M 540 0 L 560 90 Q 600 130 620 200 Q 680 300 730 370 Q 750 430 720 500 Q 680 570 580 610 L 300 625 Q 180 630 120 590 Q 60 550 40 480 Q 20 400 30 330 Q 40 260 80 200 Q 120 130 160 90 Q 200 60 260 30 Z"
        fill="none" stroke="#c8b89a" strokeWidth="28" strokeLinejoin="round"
      />
      {/* Inner road segments */}
      <line x1="280" y1="0"  x2="300" y2="120" stroke="#c8b89a" strokeWidth="22" />
      <line x1="346" y1="355" x2="200" y2="355" stroke="#c8b89a" strokeWidth="18" />
      <line x1="420" y1="500" x2="420" y2="580" stroke="#c8b89a" strokeWidth="18" />

      {/* Green areas */}
      <ellipse cx="680" cy="130" rx="75" ry="60" fill="#b8d8a0" opacity="0.7" />
      <ellipse cx="120" cy="360" rx="45" ry="35" fill="#c8dda8" opacity="0.7" />

      {/* Buildings */}
      {BUILDINGS.map((b) => {
        const isActive = b.id === activeBuilding;
        const isConnector = b.id === 'senter';
        return (
          <g key={b.id}>
            <rect
              x={b.x} y={b.y} width={b.w} height={b.h}
              rx="5" ry="5"
              fill={isActive ? '#fbbf24' : '#5b9bd5'}
              stroke={isActive ? '#d97706' : '#3a7fbf'}
              strokeWidth={isActive ? 3 : 1.5}
              className={isActive ? 'map-highlight' : ''}
            />
            {!isConnector && (
              <text
                x={b.x + b.w / 2}
                y={b.y + b.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? '#78350f' : 'white'}
                fontSize={b.w < 130 ? 9.5 : b.w < 170 ? 10.5 : 11.5}
                fontWeight="600"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                style={{ userSelect: 'none' }}
              >
                {b.label.includes('/') ? (
                  <>
                    <tspan x={b.x + b.w / 2} dy="-6">{b.label.split('/')[0].trim()}</tspan>
                    <tspan x={b.x + b.w / 2} dy="14">{'/ ' + b.label.split('/').slice(1).join('/').trim()}</tspan>
                  </>
                ) : (
                  b.label
                )}
              </text>
            )}
          </g>
        );
      })}

      {/* Resepsjon pin */}
      <text x="268" y="350" fontSize="9" fill="#374151" fontFamily="-apple-system,sans-serif">
        Resepsjon →
      </text>
    </svg>
  );
}

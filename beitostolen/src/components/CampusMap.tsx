'use client';

type Building = {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
  rotate?: number;
};

const BUILDINGS: Building[] = [
  { id: 'hjelpemiddelbygg', label: 'Hjelpemiddelbygg', x: 470, y: 130, w: 220, h: 70  },
  { id: 'ridehall',         label: 'Ridehall',         x: 150, y: 275, w: 210, h: 110 },
  { id: 'idrettshall',      label: 'Idrettshall',      x: 525, y: 270, w: 215, h: 130 },
  { id: 'stall',            label: 'Stall / adm',      x: 195, y: 395, w: 185, h: 75  },
  { id: 'svommehall',       label: 'Svømmehall',       x: 520, y: 410, w: 200, h: 95  },
  { id: 'gymsal',           label: 'Gymsal / gard. / trim', x: 485, y: 510, w: 225, h: 75 },
  { id: 'hovedbygg',        label: 'Hovedbygg',        x: 240, y: 575, w: 270, h: 95  },
  { id: 'skole',            label: 'Skole',            x: 520, y: 565, w: 170, h: 80  },
  { id: 'lege',             label: 'Lege',             x: 705, y: 575, w: 130, h: 70  },
  { id: 'familiehus',       label: 'Familiehus',       x: 260, y: 700, w: 200, h: 100 },
  { id: 'spisesal',         label: 'Spisesal',         x: 470, y: 700, w: 240, h: 110 },
  { id: 'paviljongen',      label: 'Paviljongen',      x: 875, y: 490, w: 105, h: 78  },
  { id: 'bamseli',          label: 'Bamseli',          x: 235, y: 1015, w: 90, h: 55  },
];

// Smaller orange numbered buildings (residential cabins, bottom right cluster)
const CABINS: { id: string; n: string; x: number; y: number; w: number; h: number }[] = [
  { id: 'c22', n: '22', x: 780, y: 770, w: 55, h: 55 },
  { id: 'c20', n: '20', x: 765, y: 855, w: 55, h: 45 },
  { id: 'c18', n: '18', x: 720, y: 850, w: 50, h: 45 },
  { id: 'c16', n: '16', x: 675, y: 855, w: 50, h: 50 },
  { id: 'c14', n: '14', x: 625, y: 860, w: 50, h: 50 },
  { id: 'c12', n: '12', x: 680, y: 920, w: 60, h: 55 },
  { id: 'c10', n: '10', x: 615, y: 920, w: 60, h: 55 },
  { id: 'c8',  n: '8',  x: 555, y: 925, w: 55, h: 55 },
  { id: 'c6',  n: '6',  x: 490, y: 930, w: 55, h: 55 },
];

export function CampusMap({ activeBuilding }: { activeBuilding?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1110"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="contour" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M0 40 Q 20 30 40 40 T 80 40" stroke="#b89868" strokeWidth="0.4" fill="none" opacity="0.25" />
        </pattern>
      </defs>

      {/* Base background — beige */}
      <rect width="1000" height="1110" fill="#f3e6ce" />
      {/* Subtle contour pattern */}
      <rect width="1000" height="1110" fill="url(#contour)" opacity="0.6" />

      {/* ─── Water (light blue) ─────────────────────────────── */}
      {/* Pond left edge */}
      <ellipse cx="42" cy="810" rx="30" ry="28" fill="#a8cfe5" />
      {/* Tiny pool icon next to it */}
      <rect x="22" y="830" width="14" height="10" fill="#88b8d8" rx="1" />

      {/* ─── Large green forest areas ───────────────────────── */}
      {/* Top-right large forest */}
      <path
        d="M 720 0 L 1000 0 L 1000 420 Q 950 410 900 400 Q 850 370 820 320 Q 780 260 750 200 Q 720 130 720 80 Z"
        fill="#b6d589"
      />
      {/* Small darker green spot (the orange dot in original is just a marker) */}
      <circle cx="938" cy="225" r="6" fill="#e58a3a" />

      {/* Right-side green strip below large forest */}
      <path
        d="M 850 420 Q 880 460 895 510 Q 910 580 905 660 Q 895 740 880 800 L 1000 800 L 1000 420 Z"
        fill="#bcd890" opacity="0.85"
      />
      {/* Lower-right green */}
      <path
        d="M 830 870 Q 870 900 895 960 Q 925 1020 940 1070 L 1000 1080 L 1000 800 Q 940 810 880 830 Q 850 850 830 870 Z"
        fill="#b6d589"
      />

      {/* Center-bottom green (between Hovedbygg and Bamseli) */}
      <path
        d="M 0 870 Q 80 855 160 870 Q 210 890 220 940 Q 200 1000 150 1050 L 0 1080 Z"
        fill="#b6d589"
      />
      {/* Left forest middle */}
      <path
        d="M 0 600 Q 40 620 70 680 Q 90 740 70 800 L 0 820 Z"
        fill="#bcd890"
      />
      {/* Top-left small green */}
      <path d="M 0 0 L 110 0 Q 95 60 60 80 Q 30 90 0 80 Z" fill="#bcd890" opacity="0.85" />
      {/* Small green between Hovedbygg and roads */}
      <ellipse cx="260" cy="500" rx="80" ry="40" fill="#cee0a0" opacity="0.9" />
      {/* Light grass near Stall */}
      <ellipse cx="290" cy="465" rx="65" ry="22" fill="#d8e6b0" opacity="0.7" />
      {/* Small grass between Idrettshall and Hjelpemiddelbygg */}
      <ellipse cx="450" cy="245" rx="35" ry="22" fill="#cee0a0" opacity="0.6" />

      {/* ─── Roads (warm beige-gray) ─────────────────────────── */}
      <g stroke="#bfac8a" strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Main loop top entry */}
        <path d="M 480 0 L 470 70 Q 460 110 420 130 Q 350 170 280 200 Q 230 230 200 280 Q 170 340 175 410 Q 180 480 200 540 Q 220 600 230 670 Q 240 740 240 830 Q 240 900 290 950" />
        {/* Right loop */}
        <path d="M 770 50 Q 800 110 790 200 Q 780 290 800 380 Q 820 460 810 560 Q 800 640 800 730 Q 800 830 760 920" />
        {/* Bottom horizontal Bygdinvegen */}
        <path d="M 0 1080 L 1000 1080" strokeWidth="28" />
        {/* Curve down from main loop to Bygdinvegen */}
        <path d="M 290 950 Q 350 1010 480 1050 Q 600 1075 760 1060" />
        <path d="M 760 920 Q 780 990 760 1060" />
        {/* Sentervegen (right side north-south) */}
        <path d="M 800 730 Q 810 850 800 970 Q 790 1030 760 1060" strokeWidth="20" />
        {/* Short connector between Hjelpemiddelbygg and Idrettshall area */}
        <path d="M 470 200 Q 500 230 530 260" strokeWidth="14" />
        {/* Inner spine between Hovedbygg and Spisesal */}
        <path d="M 510 650 L 540 690" strokeWidth="12" />
      </g>

      {/* Lyskapellet (small white building far left, with water) */}
      <rect x="18" y="855" width="32" height="22" fill="#f6f4ee" stroke="#a89878" strokeWidth="1" rx="1.5" />
      <text x="56" y="846" fontSize="14" fontWeight="600" fill="#374151" fontFamily="-apple-system,sans-serif">
        Lyskapellet
      </text>

      {/* ─── Main buildings (blue) ──────────────────────────── */}
      {BUILDINGS.map((b) => {
        const isActive = b.id === activeBuilding;
        const isBamseli = b.id === 'bamseli';
        const fontSize = b.w < 110 ? 11 : b.w < 160 ? 13 : b.w < 200 ? 15 : 17;
        const fill = isActive
          ? '#fbbf24'
          : isBamseli ? '#d68f5a' : '#4a90c8';
        const stroke = isActive
          ? '#d97706'
          : isBamseli ? '#a36a3c' : '#2f6aa0';
        const textFill = isActive ? '#7c4a07' : 'white';

        return (
          <g key={b.id}>
            <rect
              x={b.x} y={b.y} width={b.w} height={b.h}
              rx={isBamseli ? 2 : 3}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 3 : 1.5}
              className={isActive ? 'map-highlight' : ''}
            />
            {/* Slight 3D layer for big buildings */}
            {(b.id === 'idrettshall' || b.id === 'svommehall' || b.id === 'spisesal') && !isActive && (
              <rect
                x={b.x + 8} y={b.y - 8} width={b.w - 16} height={b.h}
                rx="3"
                fill="#5fa0d4" stroke="#2f6aa0" strokeWidth="1"
                opacity="0.92"
              />
            )}
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textFill}
              fontSize={fontSize}
              fontWeight="700"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              style={{ userSelect: 'none' }}
            >
              {b.label.includes(' / ') ? (
                b.label.split(' / ').map((part, i, arr) => (
                  <tspan
                    key={i}
                    x={b.x + b.w / 2}
                    dy={i === 0 ? -(arr.length - 1) * 7 : 14}
                  >
                    {i === 0 ? part : '/ ' + part}
                  </tspan>
                ))
              ) : (
                b.label
              )}
            </text>
          </g>
        );
      })}

      {/* Bamseli small marker icon */}
      <rect x="252" y="1040" width="14" height="10" fill="#7c3a1a" rx="1" />

      {/* ─── Cabins (orange numbered) ───────────────────────── */}
      {CABINS.map((c) => (
        <g key={c.id}>
          <rect
            x={c.x} y={c.y} width={c.w} height={c.h}
            rx="2"
            fill="#d68f5a" stroke="#a36a3c" strokeWidth="1"
          />
          <text
            x={c.x + c.w / 2}
            y={c.y + c.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="13"
            fontWeight="700"
            fontFamily="-apple-system,sans-serif"
          >
            {c.n}
          </text>
        </g>
      ))}

      {/* ─── Resepsjon arrow ────────────────────────────────── */}
      <g>
        <text x="395" y="550" fontSize="14" fontWeight="600" fill="#1e293b" fontFamily="-apple-system,sans-serif">
          Resepsjon
        </text>
        <path d="M 505 545 L 525 575" stroke="#1e293b" strokeWidth="2" fill="none" />
        <polygon points="520,569 530,580 525,567" fill="#1e293b" />
      </g>

      {/* ─── Vertical center text: "Beitostølen Helsesportsenter" ─ */}
      <text
        x="555" y="660"
        fontSize="11"
        fontWeight="600"
        fill="#374151"
        fontFamily="-apple-system,sans-serif"
        transform="rotate(90 555 660)"
        style={{ userSelect: 'none' }}
      >
        Beitostølen Helsesportsenter
      </text>

      {/* ─── Road labels ────────────────────────────────────── */}
      <text x="500" y="1100" fontSize="14" fontWeight="600" fill="#3a3a3a" textAnchor="middle" fontFamily="-apple-system,sans-serif">
        Bygdinvegen
      </text>
      <text x="580" y="1100" fontSize="13" fontWeight="700" fill="#3a3a3a" fontFamily="-apple-system,sans-serif">
        51
      </text>
      <text x="850" y="1050" fontSize="13" fontWeight="600" fill="#3a3a3a" transform="rotate(-12 850 1050)" fontFamily="-apple-system,sans-serif">
        Sentervegen
      </text>
      <text x="765" y="1020" fontSize="13" fontWeight="600" fill="#3a3a3a" transform="rotate(90 765 1020)" fontFamily="-apple-system,sans-serif">
        Sentervegen
      </text>

      {/* ─── Scale: 50 m ────────────────────────────────────── */}
      <g>
        <line x1="940" y1="685" x2="940" y2="745" stroke="#3a3a3a" strokeWidth="2" />
        <line x1="935" y1="685" x2="945" y2="685" stroke="#3a3a3a" strokeWidth="2" />
        <line x1="935" y1="745" x2="945" y2="745" stroke="#3a3a3a" strokeWidth="2" />
        <text x="955" y="720" fontSize="13" fontWeight="600" fill="#3a3a3a" fontFamily="-apple-system,sans-serif">
          50 m
        </text>
      </g>
    </svg>
  );
}

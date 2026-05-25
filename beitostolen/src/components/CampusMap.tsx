'use client';

// Highlight rectangles are calibrated against the actual map images.
// Inner map viewBox = 826×960 (kart-inner.png natural size reference)
// Full map viewBox  = 920×1080 (kart-full.png natural size reference)

type Rect = { x: number; y: number; w: number; h: number };

const INNER_HIGHLIGHTS: Record<string, Rect> = {
  hjelpemiddelbygg: { x: 391, y: 130, w: 194, h: 74  },
  ridehall:         { x: 114, y: 249, w: 208, h: 104 },
  idrettshall:      { x: 456, y: 222, w: 215, h: 130 },
  stall:            { x: 199, y: 353, w: 178, h: 68  },
  svommehall:       { x: 446, y: 347, w: 232, h: 114 },
  gymsal:           { x: 420, y: 453, w: 238, h: 72  },
  senter:           { x: 449, y: 453, w: 38,  h: 212 },
  hovedbygg:        { x: 157, y: 502, w: 296, h: 100 },
  skole:            { x: 449, y: 486, w: 188, h: 88  },
  lege:             { x: 654, y: 506, w: 126, h: 70  },
  familiehus:       { x: 157, y: 616, w: 224, h: 108 },
  spisesal:         { x: 385, y: 610, w: 265, h: 118 },
};

const FULL_HIGHLIGHTS: Record<string, Rect> = {
  hjelpemiddelbygg: { x: 389, y: 127, w: 190, h: 72  },
  ridehall:         { x: 112, y: 243, w: 204, h: 101 },
  idrettshall:      { x: 450, y: 218, w: 210, h: 125 },
  stall:            { x: 196, y: 347, w: 173, h: 66  },
  svommehall:       { x: 443, y: 337, w: 225, h: 111 },
  gymsal:           { x: 415, y: 441, w: 232, h: 70  },
  senter:           { x: 443, y: 441, w: 37,  h: 205 },
  hovedbygg:        { x: 154, y: 488, w: 290, h: 97  },
  skole:            { x: 443, y: 472, w: 184, h: 85  },
  lege:             { x: 645, y: 494, w: 122, h: 67  },
  familiehus:       { x: 154, y: 599, w: 218, h: 103 },
  spisesal:         { x: 376, y: 592, w: 259, h: 113 },
  paviljongen:      { x: 836, y: 432, w: 84,  h: 68  },
  riddercamp:       { x: 752, y: 148, w: 90,  h: 90  },
  lyskapellet:      { x: 40,  y: 758, w: 46,  h: 42  },
  bamseli:          { x: 148, y: 900, w: 112, h: 156 },
};

// Building IDs only visible on the full map
const FULL_ONLY = new Set(['paviljongen', 'riddercamp', 'lyskapellet', 'bamseli']);

function MapImage({
  src,
  viewW,
  viewH,
  activeBuilding,
  highlights,
}: {
  src: string;
  viewW: number;
  viewH: number;
  activeBuilding?: string;
  highlights: Record<string, Rect>;
}) {
  const rect = activeBuilding ? highlights[activeBuilding] : undefined;

  return (
    <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
      {/* The actual map image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Kart over Beitostølen Helsesportsenter"
        style={{ width: '100%', display: 'block' }}
        draggable={false}
      />

      {/* SVG overlay — matches image pixel dimensions via viewBox */}
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {rect && (
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            rx="5"
            fill="rgba(251,191,36,0.50)"
            stroke="#d97706"
            strokeWidth="4"
            className="map-highlight"
          />
        )}
      </svg>
    </div>
  );
}

export function CampusMap({
  activeBuilding,
  variant,
}: {
  activeBuilding?: string;
  variant?: 'inner' | 'full';
}) {
  const useFull =
    variant === 'full' ||
    (activeBuilding !== undefined && FULL_ONLY.has(activeBuilding));

  if (useFull) {
    return (
      <MapImage
        src="/kart-full.png"
        viewW={920}
        viewH={1080}
        activeBuilding={activeBuilding}
        highlights={FULL_HIGHLIGHTS}
      />
    );
  }

  return (
    <MapImage
      src="/kart-inner.png"
      viewW={826}
      viewH={960}
      activeBuilding={activeBuilding}
      highlights={INNER_HIGHLIGHTS}
    />
  );
}

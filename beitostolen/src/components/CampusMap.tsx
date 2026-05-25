'use client';

// Highlight rectangles are pixel-calibrated against the actual map images.
// Inner map: IMG_2682.jpeg  845 × 1004 px
// Full map:  IMG_2684.png   922 × 1152 px

type Rect = { x: number; y: number; w: number; h: number };

// ── Inner map highlights (IMG_2682.jpeg 845×1004) ─────────────────────────────
const INNER: Record<string, Rect> = {
  hjelpemiddelbygg: { x: 468, y: 76,  w: 248, h: 86  },
  ridehall:         { x: 52,  y: 214, w: 238, h: 112 },
  idrettshall:      { x: 444, y: 226, w: 278, h: 135 },
  stall:            { x: 160, y: 388, w: 202, h: 76  },
  svommehall:       { x: 432, y: 354, w: 284, h: 124 },
  gymsal:           { x: 408, y: 470, w: 312, h: 82  },
  senter:           { x: 418, y: 470, w: 40,  h: 225 },
  hovedbygg:        { x: 46,  y: 540, w: 374, h: 118 },
  skole:            { x: 418, y: 516, w: 222, h: 105 },
  lege:             { x: 642, y: 553, w: 158, h: 88  },
  familiehus:       { x: 18,  y: 665, w: 243, h: 128 },
  spisesal:         { x: 242, y: 649, w: 348, h: 144 },
};

// ── Full map highlights (IMG_2684.png 922×1152) ────────────────────────────────
const FULL: Record<string, Rect> = {
  hjelpemiddelbygg: { x: 374, y: 108, w: 205, h: 75  },
  ridehall:         { x: 90,  y: 228, w: 200, h: 97  },
  idrettshall:      { x: 425, y: 208, w: 228, h: 122 },
  stall:            { x: 138, y: 336, w: 175, h: 65  },
  svommehall:       { x: 420, y: 324, w: 234, h: 108 },
  gymsal:           { x: 393, y: 420, w: 263, h: 70  },
  senter:           { x: 398, y: 420, w: 38,  h: 195 },
  hovedbygg:        { x: 36,  y: 472, w: 316, h: 100 },
  skole:            { x: 396, y: 454, w: 188, h: 90  },
  lege:             { x: 588, y: 482, w: 132, h: 75  },
  familiehus:       { x: 24,  y: 576, w: 202, h: 108 },
  spisesal:         { x: 216, y: 565, w: 280, h: 120 },
  paviljongen:      { x: 836, y: 436, w: 86,  h: 70  },
  riddercamp:       { x: 750, y: 164, w: 88,  h: 88  },
  lyskapellet:      { x: 36,  y: 820, w: 56,  h: 50  },
  bamseli:          { x: 108, y: 952, w: 130, h: 110 },
};

// Buildings that only appear on the full map
const FULL_ONLY = new Set(['paviljongen', 'riddercamp', 'lyskapellet', 'bamseli']);

function Overlay({
  imgSrc,
  imgW,
  imgH,
  rect,
}: {
  imgSrc: string;
  imgW: number;
  imgH: number;
  rect?: Rect;
}) {
  return (
    <div style={{ position: 'relative', lineHeight: 0, width: '100%' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt="Kart over Beitostølen Helsesportsenter"
        style={{ width: '100%', display: 'block' }}
        draggable={false}
      />
      {rect && (
        <svg
          viewBox={`0 0 ${imgW} ${imgH}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          aria-hidden="true"
        >
          <rect
            x={rect.x} y={rect.y}
            width={rect.w} height={rect.h}
            rx={6}
            fill="rgba(251,191,36,0.48)"
            stroke="#f59e0b"
            strokeWidth={5}
            className="map-highlight"
          />
        </svg>
      )}
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
      <Overlay
        imgSrc="/IMG_2684.png"
        imgW={922}
        imgH={1152}
        rect={activeBuilding ? FULL[activeBuilding] : undefined}
      />
    );
  }

  return (
    <Overlay
      imgSrc="/IMG_2682.jpeg"
      imgW={845}
      imgH={1004}
      rect={activeBuilding ? INNER[activeBuilding] : undefined}
    />
  );
}

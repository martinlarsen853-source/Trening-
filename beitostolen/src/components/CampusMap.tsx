'use client';

// Highlight rectangles are pixel-calibrated against the actual map images.
// Inner map: IMG_2682.jpeg  845 × 1004 px
// Full map:  IMG_2684.png   922 × 1152 px

type Rect = { x: number; y: number; w: number; h: number };

// ── Inner map highlights (IMG_2682.jpeg 845×1004) ─────────────────────────────
const INNER: Record<string, Rect> = {
  hjelpemiddelbygg: { x: 481, y: 30,  w: 239, h: 122 },
  ridehall:         { x: 39,  y: 170, w: 267, h: 116 },
  idrettshall:      { x: 544, y: 240, w: 225, h: 140 },
  stall:            { x: 130, y: 328, w: 231, h: 74  },
  svommehall:       { x: 493, y: 380, w: 308, h: 125 },
  gymsal:           { x: 435, y: 500, w: 270, h: 60  },
  senter:           { x: 418, y: 470, w: 40,  h: 225 },
  hovedbygg:        { x: 39,  y: 598, w: 385, h: 132 },
  skole:            { x: 418, y: 520, w: 225, h: 110 },
  lege:             { x: 609, y: 668, w: 138, h: 76  },
  familiehus:       { x: 58,  y: 775, w: 215, h: 110 },
  spisesal:         { x: 225, y: 757, w: 365, h: 155 },
};

// ── Full map highlights (IMG_2684.png 922×1152) ────────────────────────────────
const FULL: Record<string, Rect> = {
  hjelpemiddelbygg: { x: 408, y: 118, w: 155, h: 102 },
  ridehall:         { x: 132, y: 248, w: 185, h: 80  },
  idrettshall:      { x: 424, y: 246, w: 198, h: 80  },
  stall:            { x: 205, y: 346, w: 155, h: 60  },
  svommehall:       { x: 420, y: 322, w: 222, h: 133 },
  gymsal:           { x: 363, y: 450, w: 237, h: 75  },
  senter:           { x: 398, y: 525, w: 38,  h: 55  },
  hovedbygg:        { x: 36,  y: 525, w: 320, h: 175 },
  skole:            { x: 424, y: 498, w: 125, h: 60  },
  lege:             { x: 545, y: 516, w: 95,  h: 68  },
  familiehus:       { x: 200, y: 630, w: 235, h: 75  },
  spisesal:         { x: 248, y: 628, w: 300, h: 75  },
  paviljongen:      { x: 858, y: 428, w: 63,  h: 65  },
  riddercamp:       { x: 840, y: 148, w: 82,  h: 90  },
  lyskapellet:      { x: 54,  y: 758, w: 40,  h: 35  },
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

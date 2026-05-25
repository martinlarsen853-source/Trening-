'use client';

import { X } from 'lucide-react';
import { CampusMap } from './CampusMap';

const FULL_ONLY = new Set(['paviljongen', 'riddercamp', 'lyskapellet', 'bamseli']);

type Props = {
  location: string;
  buildingId: string;
  onClose: () => void;
};

export function MapModal({ location, buildingId, onClose }: Props) {
  const useFull = FULL_ONLY.has(buildingId);
  // inner map aspect: 826/960 ≈ 0.86  |  full map aspect: 920/1080 ≈ 0.85
  const aspect = useFull ? '922/1152' : '845/1004';

  return (
    <div
      className="fixed inset-0 z-[1030] flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Sted</p>
          <p className="text-2xl font-bold text-white leading-tight">{location}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 active:bg-white/25 transition-colors flex-shrink-0"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      <div className="flex-1 px-3 pb-6 overflow-hidden flex items-center justify-center">
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: aspect, maxHeight: 'calc(100dvh - 150px)' }}
        >
          <CampusMap activeBuilding={buildingId} />
        </div>
      </div>

      <p className="text-center text-white/50 text-xs pb-safe px-4 pb-4">
        Aktiviteten finner sted i det markerte bygget
      </p>
    </div>
  );
}

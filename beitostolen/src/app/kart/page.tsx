'use client';

import { CampusMap } from '@/components/CampusMap';

export default function KartPage() {
  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Kart</h2>
      <p className="text-sm text-gray-400 mb-4">Beitostølen Helsesportsenter</p>
      <div className="rounded-3xl overflow-hidden shadow-md">
        <CampusMap variant="full" />
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">
        Trykk på en aktivitet i timeplanen for å se hvor den foregår
      </p>
    </div>
  );
}

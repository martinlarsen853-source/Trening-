'use client';

import { useState, useEffect } from 'react';
import { BygningKart, gpsToSvg } from '@/components/BygningKart';
import { Box } from 'lucide-react';

const TOUR_URL = 'https://bhss.adfectus.io/bundle/showcase.html?m=yPcBVhF91Z7&play=1&qs=1&log=0';

export default function KartPage() {
  const [show3d, setShow3d] = useState(false);
  const [ledsagerPos, setLedsagerPos] = useState<{ x: number; y: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'ok' | 'denied' | 'unsupported'>('loading');

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('unsupported'); return; }
    const id = navigator.geolocation.watchPosition(
      pos => {
        setLedsagerPos(gpsToSvg(pos.coords.latitude, pos.coords.longitude));
        setGpsStatus('ok');
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Kart</h2>
      <p className="text-sm text-gray-400 mb-4">Beitostølen Helsesportsenter</p>

      {show3d ? (
        <div className="rounded-2xl overflow-hidden mb-3" style={{ height: '65vh' }}>
          <iframe
            src={TOUR_URL}
            className="w-full h-full border-0"
            allowFullScreen
            allow="xr-spatial-tracking"
            title="3D-omvisning BHS"
          />
        </div>
      ) : (
        <div className="bg-blue-50 rounded-2xl p-4 mb-2">
          <BygningKart location={null} ledsagerPos={ledsagerPos} />
        </div>
      )}

      {/* GPS status */}
      {!show3d && (
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {gpsStatus === 'loading' && (
            <><div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" /><span className="text-xs text-gray-400">Henter posisjon…</span></>
          )}
          {gpsStatus === 'ok' && (
            <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-green-600">Posisjon aktiv · unøyaktig innendørs</span></>
          )}
          {(gpsStatus === 'denied' || gpsStatus === 'unsupported') && (
            <span className="text-xs text-gray-400">Skjematisk oversikt — ikke i målestokk</span>
          )}
        </div>
      )}

      {show3d ? (
        <button
          onClick={() => setShow3d(false)}
          className="w-full rounded-2xl bg-gray-100 text-gray-700 font-semibold py-3 text-sm active:scale-95 transition-all"
        >
          ← Oversiktskart
        </button>
      ) : (
        <button
          onClick={() => setShow3d(true)}
          className="w-full rounded-2xl bg-blue-600 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Box size={16} />
          Se 3D-omvisning av bygget
        </button>
      )}
    </div>
  );
}

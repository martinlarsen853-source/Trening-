'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus(`${data.activities_synced} aktiviteter, ${data.wellness_synced} wellness`);
        router.refresh();
      } else {
        setStatus('Feil: ' + (data.error || 'Ukjent'));
      }
    } catch {
      setStatus('Nettverksfeil');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status && <span className="text-xs text-gray-400">{status}</span>}
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        Synk
      </button>
    </div>
  );
}

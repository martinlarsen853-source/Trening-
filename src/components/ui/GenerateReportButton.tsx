'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export function GenerateReportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', { method: 'POST' });
      const data = await res.json();
      if (data.report?.id) {
        router.push(`/rapporter/${data.report.id}`);
      } else {
        setError(data.error || 'Noe gikk galt');
      }
    } catch {
      setError('Nettverksfeil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-400 mb-1">{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition-colors"
      >
        <Sparkles size={12} className={loading ? 'animate-pulse' : ''} />
        {loading ? 'Genererer...' : 'Generer rapport'}
      </button>
    </div>
  );
}

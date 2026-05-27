'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

type Log = {
  id: string;
  activity_id: string;
  date: string;
  how_went: 'bra' | 'ok' | 'vanskelig';
  load_after: 'lav' | 'middels' | 'høy' | null;
  notes: string | null;
  logged_by: string;
  created_at: string;
  activity_name?: string;
};

const HOW_CONFIG = {
  bra:       { label: '😊 Bra',       bg: 'bg-green-100',  text: 'text-green-700' },
  ok:        { label: '😐 Ok',         bg: 'bg-amber-100',  text: 'text-amber-700' },
  vanskelig: { label: '😔 Vanskelig',  bg: 'bg-red-100',    text: 'text-red-700' },
};

const LOAD_CONFIG = {
  lav:     { label: '🟢 Lav',     bg: 'bg-green-100',  text: 'text-green-700' },
  middels: { label: '🟡 Middels', bg: 'bg-amber-100',  text: 'text-amber-700' },
  høy:     { label: '🔴 Høy',     bg: 'bg-red-100',    text: 'text-red-700' },
};

export default function LoggPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const leder = localStorage.getItem('lederMode') === 'true';
    const student = localStorage.getItem('staffRole') === 'student';
    setIsStaff(leder || student);
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    supabase
      .from('activity_logs')
      .select('*, activities(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
          ...(row as Log),
          activity_name: (row.activities as { name?: string } | null)?.name ?? 'Ukjent aktivitet',
        }));
        setLogs(mapped);
        setLoading(false);
      });
  }, [isStaff]);

  if (!isStaff) {
    return (
      <div className="px-4 pt-20 text-center">
        <p className="text-gray-400 text-sm">Logg er kun tilgjengelig for stab.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Aktivitetslogg</h2>
      <p className="text-sm text-gray-500 mb-6">Siste registrerte logger fra ledere</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-semibold">Ingen logger ennå</p>
          <p className="text-sm text-gray-400 mt-1">Logger opprettes via Hjem-siden for ledere</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => {
            const how = HOW_CONFIG[log.how_went];
            const load = log.load_after ? LOAD_CONFIG[log.load_after] : null;
            return (
              <div key={log.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{log.activity_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(log.date), 'EEEE d. MMMM', { locale: nb })} · {log.logged_by}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${how.bg} ${how.text}`}>
                    {how.label}
                  </span>
                </div>
                {load && (
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${load.bg} ${load.text}`}>
                    Belastning: {load.label}
                  </span>
                )}
                {log.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-2xl px-3 py-2 leading-snug">{log.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

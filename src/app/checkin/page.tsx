'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Slider } from '@/components/ui/Slider';
import { Card, CardTitle } from '@/components/ui/Card';
import { CheckCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const BODY_PARTS = [
  'Achilles',
  'Kne',
  'Hofte',
  'Rygg',
  'Skulder',
  'Legg',
  'Hamstring',
  'Quad',
  'Fot',
  'Annet',
];

interface CheckinForm {
  energy: number;
  soreness: number;
  motivation: number;
  stress: number;
  sleep_quality: number;
  notes: string;
}

interface InjuryForm {
  body_part: string;
  pain_level: number;
  notes: string;
}

interface PastCheckin {
  date: string;
  energy: number | null;
  soreness: number | null;
  motivation: number | null;
  stress: number | null;
  sleep_quality: number | null;
}

export default function CheckinPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInjury, setShowInjury] = useState(false);
  const [injurySaved, setInjurySaved] = useState(false);
  const [history, setHistory] = useState<PastCheckin[]>([]);

  const [form, setForm] = useState<CheckinForm>({
    energy: 3,
    soreness: 3,
    motivation: 3,
    stress: 3,
    sleep_quality: 3,
    notes: '',
  });

  const [injury, setInjury] = useState<InjuryForm>({
    body_part: BODY_PARTS[0],
    pain_level: 5,
    notes: '',
  });

  useEffect(() => {
    // Load today's existing check-in
    fetch(`/api/checkin?date=${today}`)
      .then((r) => r.json())
      .then(({ checkin }) => {
        if (checkin) {
          setForm({
            energy: checkin.energy || 3,
            soreness: checkin.soreness || 3,
            motivation: checkin.motivation || 3,
            stress: checkin.stress || 3,
            sleep_quality: checkin.sleep_quality || 3,
            notes: checkin.notes || '',
          });
          setSaved(true);
        }
      })
      .catch(() => {});

    // Load history
    fetch('/api/checkin?history=true&limit=7')
      .then((r) => r.json())
      .then(({ checkins }) => setHistory(checkins || []))
      .catch(() => {});
  }, [today]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: today }),
      });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleInjurySave() {
    await fetch('/api/checkin/injury', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(injury),
    });
    setInjurySaved(true);
    setShowInjury(false);
    setTimeout(() => setInjurySaved(false), 3000);
  }

  const scoreColor = (v: number) =>
    v >= 4 ? 'text-green-400' : v <= 2 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daglig check-in</h1>
          <p className="text-sm text-gray-400">
            {format(new Date(), "EEEE d. MMMM", { locale: nb })}
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-400 text-sm">
            <CheckCircle size={16} />
            Lagret
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Slider
            label="Energinivå"
            value={form.energy}
            onChange={(v) => setForm({ ...form, energy: v })}
            emoji={['😴', '😔', '😐', '😊', '⚡']}
          />
          <Slider
            label="Muskelstølhet"
            value={form.soreness}
            onChange={(v) => setForm({ ...form, soreness: v })}
            emoji={['😖', '😣', '😐', '😌', '💪']}
          />
          <Slider
            label="Motivasjon"
            value={form.motivation}
            onChange={(v) => setForm({ ...form, motivation: v })}
            emoji={['😩', '😔', '😐', '😊', '🔥']}
          />
          <Slider
            label="Stressnivå"
            value={form.stress}
            onChange={(v) => setForm({ ...form, stress: v })}
            emoji={['😌', '🙂', '😐', '😤', '🤯']}
          />
          <Slider
            label="Søvnkvalitet"
            value={form.sleep_quality}
            onChange={(v) => setForm({ ...form, sleep_quality: v })}
            emoji={['😴', '😔', '😐', '😊', '🌙']}
          />

          <div className="pt-2">
            <label className="text-sm font-medium text-gray-200 block mb-1">
              Notat (valgfritt)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Noe på hjertet i dag?"
              rows={2}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {loading ? 'Lagrer...' : saved ? 'Oppdater' : 'Lagre check-in'}
          </button>
        </form>
      </Card>

      {/* Injury logging */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle className="mb-0">Skade/plage</CardTitle>
          {injurySaved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle size={12} /> Lagret
            </span>
          )}
        </div>

        {!showInjury ? (
          <button
            onClick={() => setShowInjury(true)}
            className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus size={14} />
            Logg en plage
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">Ny skadesregistrering</p>
              <button onClick={() => setShowInjury(false)}>
                <X size={14} className="text-gray-500 hover:text-white" />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Kroppsdel</label>
              <select
                value={injury.body_part}
                onChange={(e) => setInjury({ ...injury, body_part: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {BODY_PARTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Smertenivå: <span className="text-white font-bold">{injury.pain_level}</span>/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={injury.pain_level}
                onChange={(e) => setInjury({ ...injury, pain_level: parseInt(e.target.value) })}
                className="w-full h-2 appearance-none rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${injury.pain_level >= 7 ? '#ef4444' : injury.pain_level >= 4 ? '#f59e0b' : '#3b82f6'} ${(injury.pain_level - 1) / 9 * 100}%, #374151 ${(injury.pain_level - 1) / 9 * 100}%)`,
                }}
              />
            </div>
            <div>
              <textarea
                value={injury.notes}
                onChange={(e) => setInjury({ ...injury, notes: e.target.value })}
                placeholder="Beskriv plagen..."
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleInjurySave}
              className="w-full py-2 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Logg skade
            </button>
          </div>
        )}
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardTitle>Siste 7 dager</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left pb-2 pr-2">Dato</th>
                  <th className="text-center pb-2">Energi</th>
                  <th className="text-center pb-2">Stølhet</th>
                  <th className="text-center pb-2">Motiv.</th>
                  <th className="text-center pb-2">Stress</th>
                  <th className="text-center pb-2">Søvn</th>
                </tr>
              </thead>
              <tbody>
                {history.map((c) => (
                  <tr key={c.date} className="border-t border-gray-700/50">
                    <td className="py-1.5 pr-2 text-gray-400">
                      {format(new Date(c.date + 'T12:00:00'), 'd. MMM', { locale: nb })}
                    </td>
                    {[c.energy, c.soreness, c.motivation, c.stress, c.sleep_quality].map((v, i) => (
                      <td key={i} className={cn('text-center py-1.5 font-bold', scoreColor(v || 3))}>
                        {v || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

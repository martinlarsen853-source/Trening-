'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { CheckCircle, Plus, Trash2, RefreshCw } from 'lucide-react';

interface Goal {
  id: string;
  label: string;
  type: string;
  target_value: number | null;
  target_unit: string | null;
  active: boolean;
}

interface SyncStatus {
  last_synced_at: string | null;
  last_status: string | null;
  error_message: string | null;
}

export default function InnstillingerPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ label: '', type: 'primary' });
  const [showNewGoal, setShowNewGoal] = useState(false);

  useEffect(() => {
    // Load settings
    fetch('/api/settings')
      .then((r) => r.json())
      .then(({ settings: s }) => setSettings(s || {}))
      .catch(() => {});

    // Load goals
    fetch('/api/goals')
      .then((r) => r.json())
      .then(({ goals: g }) => setGoals(g || []))
      .catch(() => {});

    // Load sync status
    fetch('/api/sync/status')
      .then((r) => r.json())
      .then(({ status }) => setSyncStatus(status))
      .catch(() => {});
  }, []);

  async function saveSettings() {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`${data.activities_synced} aktiviteter, ${data.wellness_synced} wellness synkronisert`);
      } else {
        setSyncResult('Feil: ' + (data.error || 'Ukjent feil'));
      }
    } catch {
      setSyncResult('Nettverksfeil');
    } finally {
      setSyncing(false);
    }
  }

  async function addGoal() {
    if (!newGoal.label.trim()) return;
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newGoal, active: true }),
    });
    const data = await res.json();
    if (data.goal) {
      setGoals((prev) => [...prev, data.goal]);
      setNewGoal({ label: '', type: 'primary' });
      setShowNewGoal(false);
    }
  }

  async function deleteGoal(id: string) {
    await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function toggleGoal(goal: Goal) {
    const res = await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, active: !goal.active }),
    });
    const data = await res.json();
    if (data.goal) {
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)));
    }
  }

  const s = (key: string) => settings[key] || '';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Innstillinger</h1>

      {/* Intervals.icu */}
      <Card>
        <CardTitle>Intervals.icu</CardTitle>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Athlete ID</label>
            <input
              type="text"
              value={s('intervals_icu_athlete_id')}
              onChange={(e) => setSettings({ ...settings, intervals_icu_athlete_id: e.target.value })}
              placeholder="0 (for din egen bruker)"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            API-nøkkelen settes i <code className="bg-gray-700 px-1 rounded">.env.local</code> som{' '}
            <code className="bg-gray-700 px-1 rounded">INTERVALS_ICU_API_KEY</code>
          </p>
        </div>
      </Card>

      {/* GPS Location */}
      <Card>
        <CardTitle>Standard GPS-posisjon (for vær)</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Breddegrad (lat)</label>
            <input
              type="number"
              step="0.01"
              value={s('default_lat')}
              onChange={(e) => setSettings({ ...settings, default_lat: e.target.value })}
              placeholder="63.43"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Lengdegrad (lon)</label>
            <input
              type="number"
              step="0.01"
              value={s('default_lon')}
              onChange={(e) => setSettings({ ...settings, default_lon: e.target.value })}
              placeholder="10.40"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Trondheim: 63.43, 10.40</p>
      </Card>

      <button
        onClick={saveSettings}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors"
      >
        {settingsSaved ? <><CheckCircle size={14} /> Lagret!</> : 'Lagre innstillinger'}
      </button>

      {/* Goals */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="mb-0">Treningsmål</CardTitle>
          <button
            onClick={() => setShowNewGoal(!showNewGoal)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewGoal && (
          <div className="mb-3 p-3 bg-gray-700/50 rounded-lg space-y-2">
            <input
              type="text"
              value={newGoal.label}
              onChange={(e) => setNewGoal({ ...newGoal, label: e.target.value })}
              placeholder="f.eks. Sub-21:00 5K"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <select
                value={newGoal.type}
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="primary">Primærmål</option>
                <option value="secondary">Sekundærmål</option>
                <option value="weekly_volume">Ukentlig volum</option>
                <option value="strength_frequency">Styrkefrekvens</option>
              </select>
              <button
                onClick={addGoal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
              >
                Legg til
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0 ${!goal.active ? 'opacity-50' : ''}`}
            >
              <div className="flex-1">
                <p className="text-sm text-white">{goal.label}</p>
                <p className="text-xs text-gray-500 capitalize">{goal.type.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleGoal(goal)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    goal.active
                      ? 'border-green-600 text-green-400 hover:bg-green-900/30'
                      : 'border-gray-600 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {goal.active ? 'Aktiv' : 'Inaktiv'}
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sync */}
      <Card>
        <CardTitle>Synkronisering</CardTitle>
        <div className="space-y-3">
          {syncStatus && (
            <div className="text-sm space-y-1">
              <p className="text-gray-400">
                Siste synk:{' '}
                <span className="text-white">
                  {syncStatus.last_synced_at
                    ? new Date(syncStatus.last_synced_at).toLocaleString('nb')
                    : 'Aldri'}
                </span>
              </p>
              {syncStatus.last_status === 'error' && (
                <p className="text-red-400 text-xs">Feil: {syncStatus.error_message}</p>
              )}
            </div>
          )}
          {syncResult && (
            <p className="text-sm text-green-400">{syncResult}</p>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 border border-gray-600 rounded-lg text-sm text-white transition-colors"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synkroniserer...' : 'Manuell synk nå'}
          </button>
        </div>
      </Card>

      {/* Hevy Phase 2 */}
      <Card>
        <CardTitle>Hevy API (fase 2)</CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Hevy API aktivert</span>
            <div className="relative">
              <div className="w-10 h-5 bg-gray-600 rounded-full flex items-center px-0.5 opacity-50 cursor-not-allowed">
                <div className="w-4 h-4 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Krever Hevy Pro. API-nøkkel settes som{' '}
            <code className="bg-gray-700 px-1 rounded">HEVY_API_KEY</code> og{' '}
            <code className="bg-gray-700 px-1 rounded">HEVY_API_ENABLED=true</code>
          </p>
        </div>
      </Card>
    </div>
  );
}

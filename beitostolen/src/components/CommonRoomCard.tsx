'use client';

import { useState } from 'react';
import type { RoomCheckin } from '@/lib/supabase';
import { Users, LogIn, LogOut, Clock } from 'lucide-react';

type Props = {
  roomName: string;
  checkins: RoomCheckin[];
  parentName: string;
  onCheckin: (roomName: string, durationMinutes: number) => Promise<void>;
  onCheckout: (id: string) => Promise<void>;
};

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1 time', value: 60 },
  { label: '2 timer', value: 120 },
];

function minutesLeft(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  return Math.ceil(diff / 60000);
}

export function CommonRoomCard({ roomName, checkins, parentName, onCheckin, onCheckout }: Props) {
  const [showDuration, setShowDuration] = useState(false);
  const [loading, setLoading] = useState(false);

  const active = checkins.filter((c) => new Date(c.expires_at) > new Date());
  const myCheckin = active.find((c) => c.parent_name === parentName);

  async function handleCheckin(duration: number) {
    setLoading(true);
    setShowDuration(false);
    await onCheckin(roomName, duration);
    setLoading(false);
  }

  async function handleCheckout() {
    if (!myCheckin) return;
    setLoading(true);
    await onCheckout(myCheckin.id);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 rounded-full p-2.5">
          <Users size={22} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{roomName}</h3>
          <p className="text-sm text-gray-500">
            {active.length === 0 ? 'Tom nå' : `${active.length} person${active.length !== 1 ? 'er' : ''} her`}
          </p>
        </div>
      </div>

      {active.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {active.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                c.parent_name === parentName ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800 text-sm">{c.parent_name}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {minutesLeft(c.expires_at)} min igjen
              </span>
            </div>
          ))}
        </div>
      )}

      {myCheckin ? (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-3 transition-colors active:scale-95 disabled:opacity-50"
        >
          <LogOut size={18} />
          Jeg drar nå
        </button>
      ) : showDuration ? (
        <div>
          <p className="text-sm text-gray-600 mb-3 font-medium">Hvor lenge blir du?</p>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => handleCheckin(d.value)}
                disabled={loading}
                className="bg-blue-600 text-white font-semibold rounded-xl py-3 text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDuration(false)}
            className="w-full mt-2 text-gray-400 text-sm py-2"
          >
            Avbryt
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowDuration(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition-colors active:scale-95 disabled:opacity-50"
        >
          <LogIn size={18} />
          Jeg er her
        </button>
      )}
    </div>
  );
}

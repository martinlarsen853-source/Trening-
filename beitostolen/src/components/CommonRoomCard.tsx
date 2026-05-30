'use client';

import { useState } from 'react';
import type { RoomCheckin } from '@/lib/supabase';
import { Users, LogIn, LogOut, Clock, Minus, Plus } from 'lucide-react';

type Props = {
  roomName: string;
  checkins: RoomCheckin[];
  parentName: string;
  onCheckin: (roomName: string, durationMinutes: number) => Promise<void>;
  onCheckout: (id: string) => Promise<void>;
};

const MIN_DURATION = 30;
const MAX_DURATION = 240;
const STEP = 30;

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  if (h === Math.floor(h)) return `${h} time${h !== 1 ? 'r' : ''}`;
  return `${h} timer`;
}

function minutesLeft(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  return Math.ceil(diff / 60000);
}

export function CommonRoomCard({ roomName, checkins, parentName, onCheckin, onCheckout }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  const active = checkins.filter(
    (c) => c.room_name === roomName && new Date(c.expires_at) > new Date()
  );
  const myCheckin = active.find((c) => c.parent_name === parentName);

  async function confirmCheckin() {
    setLoading(true);
    setShowPicker(false);
    await onCheckin(roomName, duration);
    setLoading(false);
  }

  async function handleCheckout() {
    if (!myCheckin) return;
    setLoading(true);
    await onCheckout(myCheckin.id);
    setLoading(false);
  }

  function adjustDuration(delta: number) {
    setDuration((d) => Math.min(MAX_DURATION, Math.max(MIN_DURATION, d + delta)));
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 shadow-md shadow-blue-500/20">
          <Users size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">{roomName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length === 0 ? 'Tom nå' : `${active.length} ${active.length === 1 ? 'person' : 'personer'} her`}
          </p>
        </div>
      </div>

      {active.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-5">
          {active.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-4 py-2.5 rounded-2xl ${
                c.parent_name === parentName
                  ? 'bg-blue-50 ring-1 ring-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800 text-sm">{c.parent_name}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500 tabular-nums">
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
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl py-3.5 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          <LogOut size={18} />
          Jeg drar nå
        </button>
      ) : showPicker ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600 font-medium text-center">Hvor lenge blir du?</p>
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              onClick={() => adjustDuration(-STEP)}
              disabled={duration <= MIN_DURATION}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
            >
              <Minus size={20} />
            </button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
                {formatDuration(duration)}
              </div>
            </div>
            <button
              onClick={() => adjustDuration(STEP)}
              disabled={duration >= MAX_DURATION}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPicker(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl py-3 active:scale-[0.98] transition-transform"
            >
              Avbryt
            </button>
            <button
              onClick={confirmCheckin}
              disabled={loading}
              className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold rounded-2xl py-3 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              Bekreft
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl py-3.5 transition-colors active:scale-[0.98] disabled:opacity-50 shadow-md shadow-blue-500/20"
        >
          <LogIn size={18} />
          Jeg er her
        </button>
      )}
    </div>
  );
}

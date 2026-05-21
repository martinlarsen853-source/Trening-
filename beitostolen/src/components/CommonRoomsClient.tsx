'use client';

import { useState, useEffect } from 'react';
import { supabase, type RoomCheckin } from '@/lib/supabase';
import { CommonRoomCard } from './CommonRoomCard';
import { NameSetup } from './NameSetup';

type Props = { rooms: string[] };

export function CommonRoomsClient({ rooms }: Props) {
  const [parentName, setParentName] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<RoomCheckin[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('parentName');
    if (stored) setParentName(stored);
  }, []);

  useEffect(() => {
    fetch('/api/checkins')
      .then((r) => r.json())
      .then((data) => setCheckins(data.checkins ?? []));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('checkins-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_checkins' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCheckins((prev) => [...prev, payload.new as RoomCheckin]);
        } else if (payload.eventType === 'DELETE') {
          setCheckins((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Periodically remove expired checkins from local state
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckins((prev) => prev.filter((c) => new Date(c.expires_at) > new Date()));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleCheckin(roomName: string, durationMinutes: number) {
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_name: roomName, parent_name: parentName, duration_minutes: durationMinutes }),
    });
    const data = await res.json();
    if (data.checkin) {
      setCheckins((prev) => [...prev, data.checkin]);
    }
  }

  async function handleCheckout(id: string) {
    await fetch(`/api/checkins?id=${id}`, { method: 'DELETE' });
    setCheckins((prev) => prev.filter((c) => c.id !== id));
  }

  if (!parentName) {
    return (
      <NameSetup
        storageKey="parentName"
        label="Hva heter du?"
        placeholder="Skriv ditt navn..."
        onSet={setParentName}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rooms.map((room) => (
        <CommonRoomCard
          key={room}
          roomName={room}
          checkins={checkins}
          parentName={parentName}
          onCheckin={handleCheckin}
          onCheckout={handleCheckout}
        />
      ))}
    </div>
  );
}

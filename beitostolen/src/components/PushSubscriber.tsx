'use client';

import { useEffect } from 'react';
import { VAPID_PUBLIC_KEY } from '@/lib/supabase';

export function PushSubscriber() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      const name =
        localStorage.getItem('childName') ||
        localStorage.getItem('parentName') ||
        'Ukjent';

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subscription: sub.toJSON() }),
      });
    }

    // Ask after a short delay so it doesn't interrupt first render
    const t = setTimeout(subscribe, 3000);
    return () => clearTimeout(t);
  }, []);

  return null;
}

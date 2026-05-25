import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } from './supabase';

export async function sendPushToAll(title: string, body: string, url = '/') {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:martin@beitostolen.no';
  if (!privateKey) return;

  webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: subs } = await supabase.from('push_subscriptions').select('*');
  if (!subs?.length) return;

  const payload = JSON.stringify({ title, body, url });

  await Promise.allSettled(
    subs.map((row) =>
      webpush
        .sendNotification(row.subscription as webpush.PushSubscription, payload)
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', row.id);
          }
        })
    )
  );
}

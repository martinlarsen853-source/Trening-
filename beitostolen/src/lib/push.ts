import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export async function sendPushToAll(title: string, body: string, url = '/') {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

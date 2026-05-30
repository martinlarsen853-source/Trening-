'use client';
import dynamic from 'next/dynamic';

const LederInbox = dynamic(
  () => import('@/components/LederInbox').then(m => ({ default: m.LederInbox })),
  { ssr: false }
);

export default function InboxPage() {
  return <LederInbox />;
}

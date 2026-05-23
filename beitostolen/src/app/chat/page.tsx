'use client';
import dynamic from 'next/dynamic';

const ChatClient = dynamic(
  () => import('@/components/ChatClient').then(m => ({ default: m.ChatClient })),
  { ssr: false }
);

export default function ChatPage() {
  return (
    <div className="max-w-lg mx-auto">
      <ChatClient />
    </div>
  );
}

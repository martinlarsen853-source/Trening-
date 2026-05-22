import { ChatClient } from '@/components/ChatClient';

export default function ChatPage() {
  return (
    <div className="max-w-lg mx-auto px-0">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Chat</h1>
        <p className="text-sm text-gray-500 mt-0.5">Snakk med gruppen eller kontakt staben</p>
      </div>
      <ChatClient />
    </div>
  );
}

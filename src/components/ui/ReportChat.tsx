'use client';

import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Card, CardTitle } from './Card';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  reportContent: string;
  reportId: string;
}

export function ReportChat({ reportContent }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportContent, question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer || data.error || 'Noe gikk galt' },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Nettverksfeil' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full py-3 px-4 bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
      >
        <MessageSquare size={15} className="text-blue-400" />
        Still et oppfølgingsspørsmål til AI-coachen
      </button>
    );
  }

  return (
    <Card>
      <CardTitle>Spør AI-coachen</CardTitle>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Still et spørsmål om rapporten, f.eks. &ldquo;Hva bør jeg gjøre annerledes neste uke?&rdquo;
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'rounded-lg p-2.5 text-sm',
              msg.role === 'user'
                ? 'bg-blue-900/40 text-blue-100 ml-4'
                : 'bg-gray-700 text-gray-200 mr-4'
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-700 rounded-lg p-2.5 mr-4">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Skriv spørsmålet ditt..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </Card>
  );
}

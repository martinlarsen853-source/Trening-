'use client';

import { useState } from 'react';

type Props = {
  storageKey: string;
  label: string;
  placeholder: string;
  onSet: (name: string) => void;
};

export function NameSetup({ storageKey, label, placeholder, onSet }: Props) {
  const [input, setInput] = useState('');

  function submit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    localStorage.setItem(storageKey, trimmed);
    onSet(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{label}</h2>
        <p className="text-gray-500 text-sm mb-6">
          Skriv inn én gang – siden husker det for deg.
        </p>
        <input
          autoFocus
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 mb-4"
        />
        <button
          onClick={submit}
          disabled={!input.trim()}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-lg font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          Fortsett
        </button>
      </div>
    </div>
  );
}

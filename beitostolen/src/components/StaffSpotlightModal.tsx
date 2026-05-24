'use client';

import Image from 'next/image';

const COLORS = [
  'bg-indigo-500','bg-blue-500','bg-violet-500',
  'bg-emerald-500','bg-amber-500','bg-rose-500',
];
function colorForName(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

type Props = { name: string; photoUrl: string | null; onClose: () => void };

export function StaffSpotlightModal({ name, photoUrl, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[1020] flex items-center justify-center bg-black/75 backdrop-blur-sm px-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl flex flex-col items-center px-10 py-10 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            width={200}
            height={200}
            className="rounded-full object-cover"
            style={{ width: 200, height: 200 }}
          />
        ) : (
          <span
            className={`rounded-full flex items-center justify-center font-bold text-white text-7xl ${colorForName(name)}`}
            style={{ width: 200, height: 200 }}
          >
            {initials(name)}
          </span>
        )}
        <p className="text-3xl font-bold text-gray-900 mt-7 text-center leading-tight">
          {name}
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-8 py-3 rounded-2xl bg-gray-100 text-gray-600 text-base font-semibold active:scale-95 transition-transform"
        >
          Lukk
        </button>
      </div>
    </div>
  );
}

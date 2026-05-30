'use client';

import Image from 'next/image';

const COLORS = [
  'bg-indigo-500', 'bg-blue-500', 'bg-violet-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
];

function colorForName(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function StaffAvatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const dim = { sm: 28, md: 40, lg: 56, xl: 80, '2xl': 140 }[size];
  const textSize = { sm: 'text-[9px]', md: 'text-xs', lg: 'text-sm', xl: 'text-lg', '2xl': 'text-4xl' }[size];

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={dim}
        height={dim}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <span
      className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white ${colorForName(name)} ${textSize}`}
      style={{ width: dim, height: dim }}
    >
      {initials(name)}
    </span>
  );
}

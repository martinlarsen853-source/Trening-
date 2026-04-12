'use client';

import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  emoji?: string[];
}

const defaultEmoji = ['😴', '😔', '😐', '😊', '🔥'];

export function Slider({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  emoji = defaultEmoji,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <span className="text-lg">{emoji[value - min] || value}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 appearance-none rounded-full outline-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 ${pct}%, #374151 ${pct}%)`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {Array.from({ length: max - min + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(min + i)}
            className={cn(
              'text-xs w-5 h-5 rounded-full flex items-center justify-center transition-colors',
              value === min + i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {min + i}
          </button>
        ))}
      </div>
    </div>
  );
}
